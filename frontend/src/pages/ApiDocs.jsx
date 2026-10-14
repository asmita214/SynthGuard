// src/pages/ApiDocs.jsx
import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHero } from '../components/page/PageHero';
import { Reveal } from '../components/motion/Reveal';
import { API_BASE } from '../lib/api';

/* ---------- copyable code block ---------- */
function CodeBlock({ code, label = 'copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative group overflow-hidden rounded-xl border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line bg-white/70 px-4 py-2">
        <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.14em] text-ink-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.72rem] font-medium text-ink-2 transition-colors hover:bg-brand-mist hover:text-brand-3"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.78rem] leading-[1.7] text-ink-2">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ---------- collapsible endpoint panel ---------- */
function Endpoint({ method, path, summary, children }) {
  const [open, setOpen] = useState(true);
  const methodColor =
    method === 'POST'
      ? 'bg-brand-mist text-brand-3 border-brand/25'
      : 'bg-info-soft text-info border-info/25';

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 border-b border-line bg-surface-2/60 px-6 py-4 text-left transition-colors hover:bg-surface-2"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-md border px-2 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${methodColor}`}>
            {method}
          </span>
          <code className="font-mono text-[0.86rem] font-medium text-ink">{path}</code>
          <span className="hidden text-[0.82rem] text-ink-muted md:inline">· {summary}</span>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-ink-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-6 px-6 py-6">
              <p className="text-[0.86rem] text-ink-muted md:hidden">{summary}</p>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ name, type, required, description }) {
  return (
    <div className="grid grid-cols-[minmax(0,180px)_1fr] gap-4 border-b border-line py-3 last:border-b-0">
      <div>
        <code className="font-mono text-[0.82rem] font-medium text-ink">{name}</code>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-[0.66rem] text-ink-faint">{type}</span>
          {required && (
            <span className="rounded-full bg-danger-soft px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-danger">
              required
            </span>
          )}
        </div>
      </div>
      <p className="text-[0.84rem] leading-[1.65] text-ink-2">{description}</p>
    </div>
  );
}

/* ---------- example payloads ---------- */
const BASE = API_BASE;

const CURL_UPLOAD = `curl -X POST ${BASE}/upload \\
  -F "file=@customers.csv" \\
  -F "max_rows=5000"`;

const FETCH_UPLOAD = `const form = new FormData();
form.append('file', file);        // a File from an <input type="file">
form.append('max_rows', '5000');  // omit to use the server default

const res = await fetch('${BASE}/upload', {
  method: 'POST',
  body: form,                     // do NOT set Content-Type manually
});
const data = await res.json();
// data.dataset_id, data.profile, data.row_count`;

const UPLOAD_RESPONSE = `{
  "dataset_id": "ds_8f3a2c1b",
  "row_count": 3000,
  "profile": {
    "row_count": 3000,
    "column_count": 6,
    "columns": [
      {
        "name": "quantity",
        "type": "numeric",
        "missing_pct": 0.0,
        "unique_count": 8,
        "is_pii": false,
        "mean": 4.51,
        "std": 2.28,
        "min": 1,
        "max": 8
      },
      {
        "name": "category",
        "type": "categorical",
        "missing_pct": 0.0,
        "unique_count": 6,
        "is_pii": false,
        "top_values": [
          { "value": "Beverages", "count": 712 },
          { "value": "Snacks",    "count": 604 }
        ]
      },
      {
        "name": "customer_id",
        "type": "identifier",
        "missing_pct": 0.0,
        "unique_count": 1394,
        "is_pii": true
      }
    ]
  }
}`;

const CURL_GENERATE = `curl -X POST ${BASE}/generate \\
  -F "dataset_id=ds_8f3a2c1b" \\
  -F "target_col=category" \\
  -F "epsilon=5" \\
  -F "n_rows=2000"   # omit this field entirely to use the server default`;

const FETCH_GENERATE = `const form = new FormData();
form.append('dataset_id', datasetId);
form.append('target_col', targetCol);
form.append('epsilon', String(epsilon));
if (nRows != null && String(nRows).trim() !== '') {
  form.append('n_rows', String(nRows));   // only when the user set it
}

const res = await fetch('${BASE}/generate', { method: 'POST', body: form });
const { job_id, status } = await res.json();`;

const GENERATE_RESPONSE = `{
  "job_id": "job_4a7f3e1c9b2d",
  "status": "pending"
}`;

const GENERATE_400 = `{
  "detail": "Invalid target column. Valid options: category, quantity."
}`;

const JOB_RESPONSE = `{
  "job_id": "job_4a7f3e1c9b2d",
  "status": "completed",
  "result": {
    "fidelity": {
      "quantity":     0.94,
      "unit_price":   0.89,
      "total_price":  0.91,
      "category":     0.93,
      "overall":      0.92
    },
    "utility": {
      "real_accuracy":      0.87,
      "synthetic_accuracy": 0.71,
      "utility_ratio":      0.816
    },
    "privacy": {
      "avg_nearest_neighbor_distance": 3.42,
      "note": "Average L2 distance from each synthetic row to its closest real row."
    },
    "synthguard_score":   87.4,
    "epsilon":            5.0,
    "dropped_columns":    ["store_id", "customer_id"],
    "target_jointly_modeled": true,
    "sample_rows": [
      { "quantity": 3, "unit_price": 4.19, "total_price": 12.57, "category": "Beverages" }
    ]
  }
}`;

const JOB_PENDING = `{
  "job_id": "job_4a7f3e1c9b2d",
  "status": "running"
}`;

const JOB_FAILED = `{
  "job_id": "job_4a7f3e1c9b2d",
  "status": "failed",
  "error": "Training diverged: loss became NaN. Try a higher epsilon or a smaller n_rows."
}`;

const POLL_JS = `let interval = 3000;               // 3s for the first two minutes
const startedAt = Date.now();

async function poll(jobId) {
  for (;;) {
    const res = await fetch(\`${BASE}/jobs/\${jobId}\`);
    const job = await res.json();

    if (job.status === 'completed' || job.status === 'failed') return job;

    if (Date.now() - startedAt > 120_000) interval = 6000;
    await new Promise((r) => setTimeout(r, interval));
  }
}`;

const CURL_DOWNLOAD = `curl ${BASE}/download/job_4a7f3e1c9b2d \\
  -o synthetic.json`;

const DOWNLOAD_RESPONSE = `[
  { "quantity": 3, "unit_price": 4.19, "total_price": 12.57, "category": "Beverages" },
  { "quantity": 1, "unit_price": 2.49, "total_price": 2.49,  "category": "Snacks"    },
  { "quantity": 6, "unit_price": 7.85, "total_price": 47.10, "category": "Household" }
]`;

export function ApiDocs() {
  return (
    <>
      <PageHero
        breadcrumb="API"
        eyebrow="Reference"
        title="Four endpoints. No SDK required."
        lead="Every SynthGuard run is four HTTP calls. The API is CORS-enabled, accepts multipart form data, and returns JSON. No authentication in this build."
      />

      {/* Base URL card */}
      <section className="section-y-sm">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow mb-1.5">Base URL</p>
                    <code className="font-mono text-[0.9rem] font-medium text-ink break-all">
                      {API_BASE}
                    </code>
                  </div>
                  <span className="rounded-full border border-brand/25 bg-brand-mist px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-brand-3">
                    Configured via VITE_API_URL
                  </span>
                </div>
                <p className="mt-4 text-[0.86rem] leading-[1.7] text-ink-2">
                  All requests in this app go through <code>src/lib/api.js</code>, which
                  handles timeouts, retries on 502/503/504, and the Render cold-start wake
                  ping. Examples below assume the same base URL.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Endpoints */}
      <section className="section-y-sm border-t border-line/60 bg-canvas-2/40">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl space-y-5">
            {/* 1. Upload */}
            <Reveal>
              <Endpoint method="POST" path="/upload" summary="Upload a CSV and receive a dataset_id and a profile.">
                <div>
                  <p className="text-[0.88rem] font-medium text-ink">Request body</p>
                  <p className="mt-1 text-[0.84rem] text-ink-muted">
                    <code>multipart/form-data</code>
                  </p>
                  <div className="mt-3 rounded-xl border border-line px-4">
                    <Field name="file"     type="File"   required description="The CSV file. First row must be a header. Maximum 100 MB." />
                    <Field name="max_rows" type="number" description="Number of rows to sample for training. Default 5000. Larger samples generally train better but take longer." />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CodeBlock label="curl" code={CURL_UPLOAD} />
                  <CodeBlock label="fetch" code={FETCH_UPLOAD} />
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Example response · 200</p>
                  <CodeBlock label="json" code={UPLOAD_RESPONSE} />
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Status codes</p>
                  <ul className="space-y-1.5 text-[0.84rem] text-ink-2">
                    <li><code className="font-mono text-brand-3">200</code> · success</li>
                    <li><code className="font-mono text-brand-3">400</code> · missing file, unsupported type, or unreadable CSV — <code>detail</code> contains the reason</li>
                    <li><code className="font-mono text-brand-3">413</code> · file exceeds 100 MB</li>
                    <li><code className="font-mono text-brand-3">500</code> · server error during profiling</li>
                  </ul>
                </div>
              </Endpoint>
            </Reveal>

            {/* 2. Generate */}
            <Reveal>
              <Endpoint method="POST" path="/generate" summary="Kick off a training run and get back a job_id.">
                <div>
                  <p className="text-[0.88rem] font-medium text-ink">Request body</p>
                  <p className="mt-1 text-[0.84rem] text-ink-muted">
                    <code>multipart/form-data</code> or{' '}
                    <code>application/x-www-form-urlencoded</code>
                  </p>
                  <div className="mt-3 rounded-xl border border-line px-4">
                    <Field name="dataset_id" type="string" required description="The id returned by POST /upload." />
                    <Field name="target_col" type="string" required description="Column to use as the classifier target during validation. Must be categorical, or numeric with unique_count ≤ 20. Otherwise the server returns 400 with the list of valid columns in detail." />
                    <Field name="epsilon"    type="number" required description="Privacy budget. 1–10 is a practical range; lower is stronger privacy and softer fidelity." />
                    <Field name="n_rows"     type="number" description="Number of synthetic rows to generate. Omit the field entirely to use the server default — do not send an empty string." />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CodeBlock label="curl" code={CURL_GENERATE} />
                  <CodeBlock label="fetch" code={FETCH_GENERATE} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · 200</p>
                    <CodeBlock label="json" code={GENERATE_RESPONSE} />
                  </div>
                  <div>
                    <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · 400 (invalid target)</p>
                    <CodeBlock label="json" code={GENERATE_400} />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Status codes</p>
                  <ul className="space-y-1.5 text-[0.84rem] text-ink-2">
                    <li><code className="font-mono text-brand-3">200</code> · job accepted, status is <code>pending</code></li>
                    <li><code className="font-mono text-brand-3">400</code> · invalid target column or invalid epsilon — <code>detail</code> lists valid options</li>
                    <li><code className="font-mono text-brand-3">404</code> · dataset_id not found</li>
                    <li><code className="font-mono text-brand-3">500</code> · server error starting the job</li>
                  </ul>
                </div>
              </Endpoint>
            </Reveal>

            {/* 3. Job status */}
            <Reveal>
              <Endpoint method="GET" path="/jobs/{job_id}" summary="Poll a job until it completes or fails.">
                <div>
                  <p className="text-[0.88rem] font-medium text-ink">Polling rules</p>
                  <ul className="mt-3 space-y-2 text-[0.84rem] leading-[1.7] text-ink-2">
                    <li>Poll every <strong>3 seconds</strong>.</li>
                    <li>After <strong>2 minutes</strong> of polling, slow to every <strong>6 seconds</strong>.</li>
                    <li>Stop on <code>completed</code> or <code>failed</code>.</li>
                    <li>If a job is still <code>running</code> after <strong>15 minutes</strong>, the server may have restarted mid-run (Render’s free tier can do this). Do not assume failure — offer the user a “start a new run” action.</li>
                  </ul>
                </div>

                <CodeBlock label="JavaScript" code={POLL_JS} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · pending / running</p>
                    <CodeBlock label="json" code={JOB_PENDING} />
                  </div>
                  <div>
                    <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · failed</p>
                    <CodeBlock label="json" code={JOB_FAILED} />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · completed</p>
                  <CodeBlock label="json" code={JOB_RESPONSE} />
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Result fields</p>
                  <ul className="space-y-2 text-[0.84rem] leading-[1.65] text-ink-2">
                    <li><code>fidelity</code> — per-column scores plus <code>overall</code>. Weights 40% of the composite.</li>
                    <li><code>utility</code> — <code>real_accuracy</code>, <code>synthetic_accuracy</code>, <code>utility_ratio</code>. Weights 30%.</li>
                    <li><code>privacy</code> — <code>avg_nearest_neighbor_distance</code> plus a human-readable <code>note</code>. Weights 30% alongside epsilon.</li>
                    <li><code>synthguard_score</code> — weighted composite on a 0–100 scale.</li>
                    <li><code>dropped_columns</code> — columns excluded from synthesis because they were typed identifier or flagged as PII.</li>
                    <li><code>target_jointly_modeled</code> — if <code>false</code>, the target column was resampled independently rather than generated jointly with the other columns.</li>
                    <li><code>sample_rows</code> — a small preview. For the full dataset, use the download endpoint.</li>
                  </ul>
                </div>
              </Endpoint>
            </Reveal>

            {/* 4. Download */}
            <Reveal>
              <Endpoint method="GET" path="/download/{job_id}" summary="Download the full synthetic dataset as JSON.">
                <div>
                  <p className="text-[0.88rem] text-ink-2">
                    Returns the entire synthetic dataset — not just the <code>sample_rows</code>{' '}
                    preview. Only call this on an explicit download action; for large jobs the
                    response can be sizeable.
                  </p>
                </div>

                <CodeBlock label="curl" code={CURL_DOWNLOAD} />

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Response · 200</p>
                  <CodeBlock label="json" code={DOWNLOAD_RESPONSE} />
                </div>

                <div>
                  <p className="mb-3 text-[0.88rem] font-medium text-ink">Status codes</p>
                  <ul className="space-y-1.5 text-[0.84rem] text-ink-2">
                    <li><code className="font-mono text-brand-3">200</code> · array of row objects</li>
                    <li><code className="font-mono text-brand-3">404</code> · job not found, or not yet completed</li>
                  </ul>
                </div>
              </Endpoint>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="section-y">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-7 shadow-card">
              <h2 className="text-ink" style={{ fontSize: '1.35rem' }}>Notes for integrators.</h2>
              <ul className="mt-4 space-y-3 text-[0.9rem] leading-[1.7] text-ink-2">
                <li>
                  <strong>Cold starts.</strong> The backend sleeps when idle. Fire a silent{' '}
                  <code>GET /openapi.json</code> on load to wake it; give the first request up
                  to 90 seconds before treating it as failed.
                </li>
                <li>
                  <strong>Retries.</strong> Only retry on network errors and 502/503/504.
                  Retrying on 400 or 404 wastes time and could double-create jobs.
                </li>
                <li>
                  <strong>Client-side CSV parsing.</strong> Parse the uploaded file in the browser
                  with PapaParse before uploading, so results pages can chart real-vs-synthetic
                  comparisons without re-fetching the original.
                </li>
                <li>
                  <strong>No raw rows in localStorage.</strong> Persist only run metadata
                  (job_id, filename, target, epsilon, created_at, status, score).
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}