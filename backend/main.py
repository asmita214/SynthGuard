from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
import json

from app.profiler import profile_dataset
from app.preprocessor import Preprocessor
from app.train_vae import train_vae
from app.validator import fidelity_score, utility_score, privacy_score, synthguard_score
from app.db import supabase

app = FastAPI(title="SynthGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_json_safe(obj):
    """Recursively converts numpy/pandas types into plain JSON-safe Python types,
    replacing NaN/Infinity with None since strict JSON doesn't allow them."""
    if isinstance(obj, dict):
        return {k: to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_json_safe(v) for v in obj]
    if isinstance(obj, (np.floating, float)):
        val = float(obj)
        if np.isnan(val) or np.isinf(val):
            return None
        return val
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...), max_rows: int = Form(5000)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if len(df) > max_rows:
            df = df.sample(max_rows, random_state=42).reset_index(drop=True)

        profile = profile_dataset(df)
        data_records = to_json_safe(df.to_dict(orient="records"))
        profile_safe = to_json_safe(profile)

        result = supabase.table("datasets").insert({
            "filename": file.filename,
            "row_count": len(df),
            "profile": profile_safe,
            "data": data_records
        }).execute()

        dataset_id = result.data[0]["id"]
        return {"dataset_id": dataset_id, "profile": profile_safe, "row_count": len(df)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {type(e).__name__}: {str(e)}")


@app.post("/generate")
async def generate_synthetic(
    background_tasks: BackgroundTasks,
    dataset_id: str = Form(...),
    target_col: str = Form(...),
    epsilon: float = Form(5.0),
    n_rows: int = Form(None)
):
    dataset_row = supabase.table("datasets").select("data").eq("id", dataset_id).execute()
    if not dataset_row.data:
        raise HTTPException(status_code=404, detail="dataset not found")

    df_columns = list(dataset_row.data[0]["data"][0].keys())
    if target_col not in df_columns:
        raise HTTPException(
            status_code=400,
            detail=f"target_col '{target_col}' not found. Available columns: {df_columns}"
        )

    job_insert = supabase.table("jobs").insert({
        "dataset_id": dataset_id,
        "target_col": target_col,
        "epsilon": epsilon,
        "status": "pending"
    }).execute()

    job_id = job_insert.data[0]["id"]

    background_tasks.add_task(run_generation_job, job_id, dataset_id, target_col, epsilon, n_rows)

    return {"job_id": job_id, "status": "pending"}


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job_row = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_row.data:
        raise HTTPException(status_code=404, detail="job not found")

    job = job_row.data[0]
    response = {"job_id": job_id, "status": job["status"]}

    if job["status"] == "completed":
        response["result"] = job["result"]
        response["result_id"] = job_id
    elif job["status"] == "failed":
        response["error"] = job["error"]

    return response


@app.get("/download/{job_id}")
async def download_synthetic(job_id: str):
    job_row = supabase.table("jobs").select("status, synthetic_data").eq("id", job_id).execute()
    if not job_row.data or job_row.data[0]["status"] != "completed":
        raise HTTPException(status_code=404, detail="result not found or job not completed")
    return job_row.data[0]["synthetic_data"]