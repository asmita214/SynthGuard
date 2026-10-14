from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import torch
import gc
import io

from app.profiler import profile_dataset
from app.preprocessor import Preprocessor
from app.train_vae import train_vae
from app.validator import fidelity_score, utility_score, privacy_score, synthguard_score
from app.db import supabase

torch.set_num_threads(1)

MAX_TRAIN_ROWS = 3000
TRAIN_EPOCHS = 150
STALE_JOB_MINUTES = 30

app = FastAPI(title="SynthGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def fail_orphaned_jobs():
    # Background jobs die when the server restarts, so anything still
    # pending/running at startup can never finish.
    try:
        supabase.table("jobs").update({
            "status": "failed",
            "error": "The server restarted while this job was running (free-tier memory limit). Please start a new run."
        }).in_("status", ["pending", "running"]).execute()
    except Exception as e:
        print("Could not clean orphaned jobs:", e)


def to_json_safe(obj):
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


def read_csv_safely(contents: bytes, max_rows: int = 5000) -> pd.DataFrame:
    for enc in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            samples = []
            reader = pd.read_csv(io.BytesIO(contents), encoding=enc, chunksize=100_000)
            for chunk in reader:
                samples.append(chunk.sample(min(len(chunk), max_rows), random_state=42))
            df = pd.concat(samples, ignore_index=True)
            return df.sample(min(len(df), max_rows), random_state=42).reset_index(drop=True)
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode the CSV. Please save it as UTF-8 and try again.")


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...), max_rows: int = Form(5000)):
    try:
        contents = await file.read()
        df = read_csv_safely(contents, max_rows)
        del contents
        gc.collect()

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
        raise HTTPException(status_code=400, detail=f"Upload failed: {type(e).__name__}: {str(e)}")


def run_generation_job(job_id: str, dataset_id: str, target_col: str, epsilon: float, n_rows: int):
    supabase.table("jobs").update({"status": "running"}).eq("id", job_id).execute()

    try:
        dataset_row = supabase.table("datasets").select("data").eq("id", dataset_id).single().execute()
        df = pd.DataFrame(dataset_row.data["data"])

        if len(df) > MAX_TRAIN_ROWS:
            df = df.sample(MAX_TRAIN_ROWS, random_state=42).reset_index(drop=True)

        profile = profile_dataset(df)
        prep = Preprocessor(profile)
        data = prep.fit_transform(df)

        usable_cols = prep.numeric_cols + prep.categorical_cols
        if not usable_cols:
            raise ValueError("No usable numeric/categorical columns found to synthesize.")

        model, achieved_epsilon = train_vae(
            data, prep.numeric_dim, prep.categorical_slices,
            latent_dim=8, epochs=TRAIN_EPOCHS, batch_size=128,
            use_dp=True, target_epsilon=epsilon, beta=0.5
        )

        rows = n_rows or len(df)
        synthetic_raw = model._module.sample(rows, latent_dim=8).numpy()
        del model
        gc.collect()

        synthetic_raw = prep.to_valid_onehot(synthetic_raw)
        synthetic_df = prep.inverse_transform(synthetic_raw)

        if target_col not in usable_cols:
            synthetic_df[target_col] = df[target_col].sample(rows, replace=True).values

        real_compare = df[usable_cols] if target_col in usable_cols else df[usable_cols + [target_col]]
        synth_compare = synthetic_df[usable_cols] if target_col in usable_cols else synthetic_df[usable_cols + [target_col]]

        fid_cols = [c for c in usable_cols if c != target_col]
        fid = fidelity_score(real_compare[fid_cols], synth_compare[fid_cols])
        util = utility_score(real_compare, synth_compare, target_col=target_col)
        priv = privacy_score(real_compare[fid_cols], synth_compare[fid_cols])
        score = synthguard_score(fid, util, priv)

        dropped_columns = [c for c in df.columns if c not in usable_cols and c != target_col]

        result = {
            "fidelity": fid,
            "utility": util,
            "privacy": priv,
            "synthguard_score": score,
            "epsilon": achieved_epsilon,
            "dropped_columns": dropped_columns,
            "target_jointly_modeled": target_col in usable_cols,
            "sample_rows": synthetic_df.head(5).to_dict(orient="records")
        }

        supabase.table("jobs").update({
            "status": "completed",
            "result": to_json_safe(result),
            "synthetic_data": to_json_safe(synthetic_df.to_dict(orient="records"))
        }).eq("id", job_id).execute()

    except Exception as e:
        supabase.table("jobs").update({"status": "failed", "error": str(e)}).eq("id", job_id).execute()
    finally:
        gc.collect()


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
    status = job["status"]
    error = job.get("error")

    if status in ("pending", "running") and job.get("created_at"):
        created = datetime.fromisoformat(job["created_at"])
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age_minutes = (datetime.now(timezone.utc) - created).total_seconds() / 60
        if age_minutes > STALE_JOB_MINUTES:
            status = "failed"
            error = "This job timed out or the server restarted mid-run. Please start a new run."

    response = {"job_id": job_id, "status": status}

    if status == "completed":
        response["result"] = job["result"]
        response["result_id"] = job_id
    elif status == "failed":
        response["error"] = error

    return response


@app.get("/download/{job_id}")
async def download_synthetic(job_id: str):
    job_row = supabase.table("jobs").select("status, synthetic_data").eq("id", job_id).execute()
    if not job_row.data or job_row.data[0]["status"] != "completed":
        raise HTTPException(status_code=404, detail="result not found or job not completed")
    return job_row.data[0]["synthetic_data"]