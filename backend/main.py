from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import os
import pandas as pd
import httpx
import gc
import io

from app.profiler import profile_dataset
from app.db import supabase
from app.jsonutil import to_json_safe

# Heavy training (torch/opacus) does NOT run here. This API only enqueues jobs;
# a GitHub Actions worker trains and writes results to Supabase.
GH_TOKEN = os.getenv("GH_TOKEN")
GH_REPO = os.getenv("GH_REPO", "asmita214/SynthGuard")
GH_REF = os.getenv("GH_REF", "main")
GH_WORKFLOW = os.getenv("GH_WORKFLOW", "train.yml")

STALE_JOB_MINUTES = 30

app = FastAPI(title="SynthGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://synthguard-xxxx.vercel.app", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Supabase health check for UptimeRobot
@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    try:
        supabase.table("datasets").select("id").limit(1).execute()
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"db error: {type(e).__name__}"
        )


def read_csv_safely(contents: bytes, max_rows: int = 5000) -> pd.DataFrame:
    for enc in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            samples = []
            reader = pd.read_csv(
                io.BytesIO(contents),
                encoding=enc,
                chunksize=100_000
            )
            for chunk in reader:
                samples.append(
                    chunk.sample(
                        min(len(chunk), max_rows),
                        random_state=42
                    )
                )
            df = pd.concat(samples, ignore_index=True)
            return df.sample(
                min(len(df), max_rows),
                random_state=42
            ).reset_index(drop=True)
        except UnicodeDecodeError:
            continue

    raise ValueError(
        "Could not decode the CSV. Please save it as UTF-8 and try again."
    )


@app.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    max_rows: int = Form(5000)
):
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

        return {
            "dataset_id": dataset_id,
            "profile": profile_safe,
            "row_count": len(df)
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Upload failed: {type(e).__name__}: {str(e)}"
        )


def dispatch_job(job_id: str, n_rows):
    url = (
        f"https://api.github.com/repos/{GH_REPO}"
        f"/actions/workflows/{GH_WORKFLOW}/dispatches"
    )

    resp = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {GH_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        json={
            "ref": GH_REF,
            "inputs": {
                "job_id": job_id,
                "n_rows": str(n_rows or "")
            }
        },
        timeout=20,
    )

    if resp.status_code != 204:
        raise RuntimeError(
            f"GitHub dispatch failed ({resp.status_code}): "
            f"{resp.text[:200]}"
        )


@app.post("/generate")
async def generate_synthetic(
    background_tasks: BackgroundTasks,
    dataset_id: str = Form(...),
    target_col: str = Form(...),
    epsilon: float = Form(5.0),
    n_rows: int = Form(None)
):
    dataset_row = (
        supabase.table("datasets")
        .select("data")
        .eq("id", dataset_id)
        .execute()
    )

    if not dataset_row.data:
        raise HTTPException(
            status_code=404,
            detail="dataset not found"
        )

    df_columns = list(
        dataset_row.data[0]["data"][0].keys()
    )

    if target_col not in df_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"target_col '{target_col}' not found. "
                f"Available columns: {df_columns}"
            )
        )

    job_insert = supabase.table("jobs").insert({
        "dataset_id": dataset_id,
        "target_col": target_col,
        "epsilon": epsilon,
        "status": "pending"
    }).execute()

    job_id = job_insert.data[0]["id"]

    if GH_TOKEN:
        try:
            dispatch_job(job_id, n_rows)
        except Exception as e:
            (
                supabase.table("jobs")
                .update({
                    "status": "failed",
                    "error": str(e)
                })
                .eq("id", job_id)
                .execute()
            )

            raise HTTPException(
                status_code=502,
                detail=str(e)
            )
    else:
        # Local dev only (needs torch installed): run in-process.
        from app.runner import run_job
        background_tasks.add_task(run_job, job_id, n_rows)

    return {
        "job_id": job_id,
        "status": "pending"
    }


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job_row = (
        supabase.table("jobs")
        .select("*")
        .eq("id", job_id)
        .execute()
    )

    if not job_row.data:
        raise HTTPException(
            status_code=404,
            detail="job not found"
        )

    job = job_row.data[0]
    status = job["status"]
    error = job.get("error")

    if status in ("pending", "running") and job.get("created_at"):
        created = datetime.fromisoformat(job["created_at"])

        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)

        age_minutes = (
            datetime.now(timezone.utc) - created
        ).total_seconds() / 60

        if age_minutes > STALE_JOB_MINUTES:
            status = "failed"
            error = (
                "This job timed out or the server restarted mid-run. "
                "Please start a new run."
            )

    response = {
        "job_id": job_id,
        "status": status
    }

    if status == "completed":
        response["result"] = job["result"]
        response["result_id"] = job_id

    elif status == "failed":
        response["error"] = error

    return response


@app.get("/download/{job_id}")
async def download_synthetic(job_id: str):
    job_row = (
        supabase.table("jobs")
        .select("status, synthetic_data")
        .eq("id", job_id)
        .execute()
    )

    if (
        not job_row.data
        or job_row.data[0]["status"] != "completed"
    ):
        raise HTTPException(
            status_code=404,
            detail="result not found or job not completed"
        )

    return job_row.data[0]["synthetic_data"]