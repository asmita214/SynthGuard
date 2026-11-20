# 🛡️ SynthGuard

**Privacy-preserving synthetic data for tabular datasets, with a score that tells you how good it is.**

🌐 **Live demo:** https://synth-guard-xi.vercel.app/
⚡ **API:** https://synthguard-backend.onrender.com/docs

Upload a CSV, pick a privacy budget (epsilon), and SynthGuard trains a differentially private Variational Autoencoder, generates a synthetic dataset, and scores it for fidelity, utility and privacy.

---

## 🧩 The problem

ML teams often can't use the data they need: customer records in healthcare, finance and retail are risky to share under laws like GDPR and India's DPDP Act.

- Deleting names and IDs isn't enough. Combinations of columns can still re-identify people.
- Naive synthetic generators can memorise and leak real rows, and often lose the statistical patterns that make data useful.
- Most tools give you data but no evidence of how private or how useful it is.

## 💡 The solution

SynthGuard learns the statistical patterns of a dataset, not the rows, and samples brand-new records from them. Training uses differential privacy (DP-SGD), which limits how much any one person's record can influence the model. Every run ends with a **SynthGuard Score** so you can see the privacy / quality trade-off.

## ✨ Features

- 📂 CSV upload with automatic profiling (numeric vs categorical columns, identifier and PII-like column detection)
- 🧠 DP-VAE training in PyTorch with Opacus; you choose epsilon
- 🧬 Synthetic data generation at any row count, with valid categorical outputs
- 📊 SynthGuard Score (0–100) with a fidelity / utility / privacy breakdown
- ⬇️ Download the synthetic CSV
- 🔄 Live job status in the UI

## 📊 SynthGuard Score

| Component | Weight | How it is measured |
|---|---|---|
| Fidelity | 40% | KS test (numeric columns) and frequency differences (categorical columns) between real and synthetic data |
| Utility | 30% | Train on synthetic, test on real, compared with a model trained on real data |
| Privacy | 30% | Nearest-neighbour distance between synthetic and real rows |

On a 3,000-row retail test dataset at epsilon 5, a run scored about **85/100** with a utility ratio of about **0.87** in under a minute. Results vary with the dataset and epsilon.

## 🏗️ Architecture

```
React (Vercel)
     │  upload / generate / poll / download
     ▼
FastAPI (Render) ──────── Supabase (Postgres: datasets, jobs)
     │  workflow_dispatch                 ▲
     ▼                                    │ result + status
GitHub Actions worker (PyTorch + Opacus) ─┘
```

- **Frontend:** React, Vite, Tailwind, Framer Motion, Recharts, PapaParse (Vercel)
- **API:** FastAPI on Render. It only profiles data, enqueues jobs and serves results (no torch, about 84 MB RAM)
- **Worker:** GitHub Actions runs the heavy training (7 GB RAM runners) and writes results to Supabase
- **Database / queue:** Supabase (Postgres). The frontend polls `/jobs/{id}`
- **Uptime:** UptimeRobot pings `/health`, which also runs a small database query

**Why a separate worker?** Training inside the API crashed on Render's free 512 MB tier, and the browser showed misleading CORS errors. Splitting the API from the training fixed it.

## 🔌 API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/upload` | Upload CSV, returns `dataset_id` and a profile |
| POST | `/generate` | Start a job (`dataset_id`, `target_col`, `epsilon`, optional `n_rows`) |
| GET | `/jobs/{job_id}` | Job status and result |
| GET | `/download/{job_id}` | Synthetic rows as JSON |
| GET | `/health` | Health check (touches the database) |

Interactive docs are at `/docs`.

## 📁 Project structure

```
SynthGuard/
├── .github/workflows/train.yml     # training worker (workflow_dispatch)
├── backend/
│   ├── main.py                     # FastAPI app
│   ├── worker.py                   # worker entry point
│   ├── requirements.txt            # API dependencies (light)
│   ├── requirements-worker.txt     # worker dependencies
│   └── app/
│       ├── profiler.py             # column typing, identifier / PII detection
│       ├── preprocessor.py         # scaling, one-hot, inverse transform
│       ├── vae.py                  # VAE model
│       ├── train_vae.py            # DP-SGD training (Opacus)
│       ├── validator.py            # fidelity, utility, privacy, score
│       ├── pipeline.py             # end-to-end training pipeline
│       ├── runner.py               # runs one job, writes results to Supabase
│       └── db.py                   # Supabase client
└── frontend/                       # React + Vite app
```

## 🚀 Run locally

**Prerequisites:** Python 3.11, Node 18+, a Supabase project.

1. **Create two tables in Supabase.** The code uses these columns:
   - `datasets`: `id`, `filename`, `row_count`, `profile` (jsonb), `data` (jsonb), `created_at`
   - `jobs`: `id`, `dataset_id`, `target_col`, `epsilon`, `status`, `result` (jsonb), `synthetic_data` (jsonb), `error`, `created_at`

2. **Backend**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt -r requirements-worker.txt
```
Create `backend/.env`:
```
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-key
```
```powershell
uvicorn main:app --reload
```
With no `GH_TOKEN` set, jobs run inside the API process, which is fine for local development.

3. **Frontend**
```powershell
cd frontend
npm install
```
Create `frontend/.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```
```powershell
npm run dev
```

## ☁️ Deployment

| Part | Where | Settings |
|---|---|---|
| Frontend | Vercel | Root directory `frontend`, env `VITE_API_URL` |
| API | Render | Root directory `backend`, env `SUPABASE_URL`, `SUPABASE_KEY`, `GH_TOKEN`, `GH_REPO` |
| Worker | GitHub Actions | Repo secrets `SUPABASE_URL`, `SUPABASE_KEY` |

`GH_TOKEN` is a fine-grained GitHub token with **Actions: Read and write** on this repo.

## ⚠️ Limitations

- Tabular data only (numeric and categorical columns)
- Training uses a sample of up to 3,000 rows
- A differential-privacy guarantee is only as meaningful as the epsilon you choose
- Free-tier hosting: the first request after idle time can be slow
- Login and API keys are not built yet

## 🗺️ Roadmap

- Authentication and API keys
- Membership-inference and other privacy attack tests
- Larger datasets and more model types

## 🧰 Tech stack

PyTorch · Opacus · scikit-learn · pandas · FastAPI · Supabase · React · Vite · Tailwind · Recharts · GitHub Actions · Vercel · Render

## 👩‍💻 Author

**Asmita** · [GitHub](https://github.com/asmita214)
