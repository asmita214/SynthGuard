import os
import sys
from app.runner import run_job

if __name__ == "__main__":
    job_id = os.environ.get("JOB_ID")
    if not job_id:
        sys.exit("JOB_ID is required")
    n = os.environ.get("N_ROWS", "").strip()
    run_job(job_id, int(n) if n.isdigit() else None)
    print("job finished:", job_id)
