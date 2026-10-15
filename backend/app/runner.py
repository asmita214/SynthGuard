import pandas as pd
from app.db import supabase
from app.jsonutil import to_json_safe


def run_job(job_id: str, n_rows: int = None):
    """Runs one job end-to-end and writes status/result to Supabase.
    Used by the GitHub Actions worker and by local dev."""
    from app.pipeline import run_pipeline  # heavy import (torch) only here

    supabase.table("jobs").update({"status": "running"}).eq("id", job_id).execute()
    try:
        job = supabase.table("jobs").select("*").eq("id", job_id).single().execute().data
        ds = supabase.table("datasets").select("data").eq("id", job["dataset_id"]).single().execute()
        df = pd.DataFrame(ds.data["data"])

        result, synthetic_df = run_pipeline(df, job["target_col"], float(job["epsilon"]), n_rows)

        supabase.table("jobs").update({
            "status": "completed",
            "result": to_json_safe(result),
            "synthetic_data": to_json_safe(synthetic_df.to_dict(orient="records")),
        }).eq("id", job_id).execute()
    except Exception as e:
        supabase.table("jobs").update(
            {"status": "failed", "error": f"{type(e).__name__}: {e}"}
        ).eq("id", job_id).execute()
        raise
