// src/pages/app/Workspace.jsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSpreadsheet, X, AlertTriangle, Sparkles, ArrowRight,
  Check, Loader2, Info, Database, ShieldAlert, Wand2, ChevronDown, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHero } from '../../components/page/PageHero';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Reveal } from '../../components/motion/Reveal';
import { Stagger, StaggerItem } from '../../components/motion/Stagger';

import { useDataset } from '../../context/DatasetContext';
import { useServerStatus } from '../../hooks/useServerStatus';
import {
  uploadDataset, generateSynthetic, getTargetCandidates, getExcludedColumns,
  getSynthesizedColumns, isQualifyingTargetColumn, explainTargetExclusion, ApiError,
} from '../../lib/api';
import {
  validateCsvFile, parseCsvFile, formatBytes,
  buildSampleDataset, SAMPLE_COLUMNS, DEFAULT_MAX_ROWS,
  MAX_FILE_BYTES, WARN_FILE_BYTES,
} from '../../lib/csv';
import { saveRun } from '../../lib/storage';

const EASE = [0.16, 1, 0.3, 1];

/* ================================================================== */

export function Workspace() {
  const navigate = useNavigate();
  const dataset = useDataset();
  const { isOffline, isWaking } = useServerStatus();

  // step 1 = upload, step 2 = review & configure
  const [step, setStep] = useState(dataset.hasDataset ? 2 : 1);

  // reset step if user clears dataset (e.g. via "change dataset" button)
  if (step === 2 && !dataset.hasDataset) setStep(1);

  return (
    <>
      <PageHero
        breadcrumb="Workspace"
        eyebrow={step === 1 ? 'Step 1 · Upload' : 'Step 2 · Configure'}
        title={step === 1 ? 'Bring a CSV.' : 'Choose your target and privacy budget.'}
        lead={
          step === 1
            ? 'We analyze the structure of your dataset — column types, missing values, PII candidates — before any model is trained. Nothing leaves this session until you press Generate.'
            : 'Review the profile SynthGuard produced. Identifier and PII columns are excluded from synthesis automatically. You pick the target column and epsilon.'
        }
      />

      {/* Stepper */}
      <section className="page-shell">
        <Reveal>
          <div className="mx-auto mb-10 max-w-3xl">
            <StepRail step={step} />
          </div>
        </Reveal>
      </section>

      {/* Server status warning */}
      {(isOffline || isWaking) && (
        <section className="page-shell mb-8">
          <div className="mx-auto max-w-3xl">
            <div
              className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-[0.88rem] ${
                isOffline
                  ? 'border-danger/25 bg-danger-soft/50 text-ink-2'
                  : 'border-warn/25 bg-warn-soft/60 text-ink-2'
              }`}
            >
              <AlertTriangle
                className={`size-4 shrink-0 ${isOffline ? 'text-danger' : 'text-warn'}`}
                aria-hidden="true"
              />
              <p>
                {isOffline
                  ? "The SynthGuard server isn't reachable right now. You can still prepare a file — nothing will be sent until it comes back online."
                  : "The server is waking up (Render's free tier sleeps when idle). Your first request may take up to 90 seconds. You can still prepare everything on this page."}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="page-shell pb-24">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <StepOne onComplete={() => setStep(2)} />
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <StepTwo
                onChangeDataset={() => {
                  dataset.clear();
                  setStep(1);
                }}
                onGenerated={(jobId) => navigate(`/app/job/${jobId}`)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}

/* ================================================================== */
/* Step rail                                                           */
/* ================================================================== */

function StepRail({ step }) {
  const steps = [
    { n: 1, label: 'Upload dataset' },
    { n: 2, label: 'Review & configure' },
    { n: 3, label: 'Generate' },
  ];
  return (
    <ol className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <li key={s.n} className="flex flex-1 items-center gap-3">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[0.78rem] font-semibold transition-colors ${
                active
                  ? 'border-brand bg-brand text-white'
                  : done
                    ? 'border-brand/30 bg-brand-mist text-brand-3'
                    : 'border-line bg-white text-ink-muted'
              }`}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : s.n}
            </div>
            <span
              className={`hidden text-[0.86rem] font-medium sm:inline ${
                active ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ================================================================== */
/* STEP 1 — Upload                                                     */
/* ================================================================== */

function StepOne({ onComplete }) {
  const dataset = useDataset();
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [maxRows, setMaxRows] = useState(DEFAULT_MAX_ROWS);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---------------- file handling ---------------- */

  const handleFile = useCallback(async (f) => {
    setError(null);
    setParsed(null);

    const v = validateCsvFile(f);
    setValidation(v);
    setFile(f);

    if (!v.ok) return;

    setParsing(true);
    try {
      const result = await parseCsvFile(f);
      setParsed(result);
      dataset.setParsedCsv({ rows: result.rows, columns: result.columns });
    } catch (err) {
      setError({ title: "Couldn't read that file", message: err.message });
    } finally {
      setParsing(false);
    }
  }, [dataset]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const useSample = () => {
    const rows = buildSampleDataset(3000);
    const csv = Papa.unparse(rows, { columns: SAMPLE_COLUMNS, newline: '\n' });
    const f = new File([csv], 'synthguard-sample-retail.csv', { type: 'text/csv' });
    dataset.setParsedCsv({ rows, columns: SAMPLE_COLUMNS });
    setFile(f);
    setValidation({ ok: true, level: 'ok', reason: null, message: null });
    setParsed({ rows, columns: SAMPLE_COLUMNS, rowCount: rows.length, meta: {} });
  };

  const reset = () => {
    setFile(null);
    setValidation(null);
    setParsed(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ---------------- upload ---------------- */

  const handleUpload = async () => {
    if (!file || !parsed) return;
    setUploading(true);
    setError(null);

    try {
      const res = await uploadDataset(file, { maxRows });
      dataset.setDataset({
        datasetId: res.dataset_id,
        profile: res.profile,
        filename: file.name,
        rows: parsed.rows,
        columns: parsed.columns,
      });
      toast.success('Dataset uploaded');
      onComplete();
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Upload failed.';
      setError({
        title: err.status === 413 ? 'File too large' : 'Upload failed',
        message,
        retry: true,
      });
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      {/* Main column */}
      <div className="space-y-6">
        <Card size="lg">
          <CardBody className="p-7">
            {!file ? (
              <DropZone
                onDrop={onDrop}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onSelect={() => inputRef.current?.click()}
                onSample={useSample}
              />
            ) : (
              <FilePreview
                file={file}
                validation={validation}
                parsed={parsed}
                parsing={parsing}
                onReset={reset}
              />
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onSelect}
            />
          </CardBody>
        </Card>

        {error && (
          <ErrorState
            title={error.title}
            message={error.message}
            onRetry={error.retry ? handleUpload : undefined}
            secondary={
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose a different file
              </Button>
            }
          />
        )}

        {/* Max rows */}
        {parsed && !error && (
          <Card>
            <CardBody className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-brand" aria-hidden="true" />
                    <p className="font-semibold text-ink">Rows to use for training</p>
                  </div>
                  <p className="mt-2 text-[0.86rem] leading-[1.7] text-ink-2">
                    We sample this many rows from your file before training. More rows
                    generally improve quality but take longer to train. Default is{' '}
                    {DEFAULT_MAX_ROWS.toLocaleString()}.
                  </p>
                </div>
                <input
                  type="number"
                  min={100}
                  step={100}
                  max={parsed.rowCount}
                  value={maxRows}
                  onChange={(e) => setMaxRows(Number(e.target.value) || DEFAULT_MAX_ROWS)}
                  className="h-11 w-32 rounded-xl border border-line bg-white px-4 text-right font-mono text-[0.95rem] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Upload button */}
        {parsed && !error && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleUpload}
              loading={uploading}
              disabled={parsing}
            >
              Upload & continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar tips */}
      <div className="space-y-5">
        <Card>
          <CardBody className="p-6">
            <p className="font-semibold text-ink">What to upload</p>
            <ul className="mt-3 space-y-2.5 text-[0.85rem] leading-[1.65] text-ink-2">
              <li className="flex gap-2">
                <Check className="mt-1 size-3.5 shrink-0 text-brand-3" aria-hidden="true" />
                A CSV with a header row.
              </li>
              <li className="flex gap-2">
                <Check className="mt-1 size-3.5 shrink-0 text-brand-3" aria-hidden="true" />
                One row per record. Mixed numeric and categorical columns work best.
              </li>
              <li className="flex gap-2">
                <Check className="mt-1 size-3.5 shrink-0 text-brand-3" aria-hidden="true" />
                Up to 100 MB. Files over 25 MB are accepted but slow to train.
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-brand" aria-hidden="true" />
              <p className="font-semibold text-ink">What happens to your file</p>
            </div>
            <p className="mt-2 text-[0.85rem] leading-[1.7] text-ink-2">
              It is sent to the backend, profiled, and used only to train this one session’s
              model. Raw rows are not written to disk. See the{' '}
              <a href="/privacy" className="text-brand-3 underline underline-offset-4">
                Privacy page
              </a>{' '}
              for specifics.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- DropZone ---------------- */

function DropZone({ onDrop, dragOver, setDragOver, onSelect, onSample }) {
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors duration-200 ${
          dragOver
            ? 'border-brand bg-brand-mist/50'
            : 'border-line-strong bg-surface-2/40 hover:border-brand/50 hover:bg-brand-mist/30'
        }`}
      >
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-line bg-white text-brand-3 shadow-soft transition-transform duration-300 group-hover:-translate-y-0.5">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <p className="font-semibold text-ink">Drop your CSV here</p>
        <p className="mt-1.5 text-[0.88rem] text-ink-2">or click to browse</p>
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
          CSV · up to 100 MB
        </p>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint">
          or
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={onSample}
        className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-5 text-left transition-colors duration-200 hover:border-brand/40 hover:bg-brand-mist/30"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-mist text-brand-3">
          <Wand2 className="size-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink">Try with sample data</p>
          <p className="mt-0.5 text-[0.84rem] text-ink-2">
            A 3,000-row retail dataset, generated in your browser. No upload required.
          </p>
        </div>
        <ArrowRight className="size-4 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-3" />
      </button>
    </div>
  );
}

/* ---------------- FilePreview ---------------- */

function FilePreview({ file, validation, parsed, parsing, onReset }) {
  const tone = validation?.level === 'warn' ? 'warn' : 'ok';

  return (
    <div>
      <div className="flex items-start gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
          <FileSpreadsheet className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{file.name}</p>
              <p className="mt-0.5 font-mono text-[0.78rem] text-ink-muted">
                {formatBytes(file.size)}
                {parsed && <> · {parsed.rowCount.toLocaleString()} rows · {parsed.columns.length} columns</>}
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors hover:border-danger/30 hover:text-danger"
              aria-label="Remove file"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {parsing && (
            <div className="mt-4 flex items-center gap-2 text-[0.84rem] text-ink-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Parsing in your browser…
            </div>
          )}

          {validation?.message && (
            <div
              className={`mt-4 flex gap-2.5 rounded-xl border px-4 py-3 text-[0.84rem] leading-[1.6] ${
                tone === 'warn'
                  ? 'border-warn/25 bg-warn-soft/60 text-ink-2'
                  : 'border-brand/20 bg-brand-mist/50 text-ink-2'
              }`}
            >
              {tone === 'warn' ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden="true" />
              ) : (
                <Check className="mt-0.5 size-3.5 shrink-0 text-brand-3" aria-hidden="true" />
              )}
              <span>{validation.message}</span>
            </div>
          )}

          {parsed && parsed.columns.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {parsed.columns.slice(0, 8).map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[0.7rem] text-ink-2"
                >
                  {c}
                </span>
              ))}
              {parsed.columns.length > 8 && (
                <span className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[0.7rem] text-ink-muted">
                  +{parsed.columns.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* STEP 2 — Review & configure                                         */
/* ================================================================== */

function StepTwo({ onChangeDataset, onGenerated }) {
  const dataset = useDataset();
  const profile = dataset.profile;
  const columns = profile?.columns ?? [];

  const synthesized = useMemo(() => getSynthesizedColumns(columns), [columns]);
  const excluded = useMemo(() => getExcludedColumns(columns), [columns]);
  const targets = useMemo(() => getTargetCandidates(columns), [columns]);

  const [targetCol, setTargetCol] = useState(
    () => dataset.pendingConfig?.targetCol ?? targets[0]?.name ?? '',
  );
  const [epsilon, setEpsilon] = useState(dataset.pendingConfig?.epsilon ?? 5);
  const [nRows, setNRows] = useState(dataset.pendingConfig?.nRows ?? '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const noTargets = targets.length === 0;
  const canGenerate = Boolean(targetCol) && !noTargets && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);

    try {
      const { job_id } = await generateSynthetic({
        datasetId: dataset.datasetId,
        targetCol,
        epsilon,
        nRows: nRows === '' ? null : nRows,
      });

      // Persist to History immediately so a mid-run reload can still find it.
      saveRun({
        job_id,
        filename: dataset.filename ?? 'Untitled dataset',
        target_col: targetCol,
        epsilon: Number(epsilon),
        created_at: new Date().toISOString(),
        status: 'pending',
        synthguard_score: null,
      });

      dataset.clearPendingConfig?.();
      onGenerated(job_id);
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Could not start the run.';
      setError({ title: 'Generation failed', message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Dataset summary */}
      <Reveal>
        <Card size="lg">
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle as="h2">Dataset summary</CardTitle>
              <CardDescription>
                {dataset.filename} · profile from POST /upload
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onChangeDataset}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Change dataset
            </Button>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryStat label="Total rows" value={profile?.row_count?.toLocaleString() ?? '—'} />
              <SummaryStat label="Total columns" value={profile?.column_count ?? '—'} />
              <SummaryStat label="Flagged / excluded" value={excluded.length} tone="warn" />
              <SummaryStat label="Will be synthesized" value={synthesized.length} tone="brand" />
            </div>
          </CardBody>
        </Card>
      </Reveal>

      {/* Column table */}
      <Reveal>
        <Card size="lg">
          <CardHeader>
            <CardTitle as="h2">Column profile</CardTitle>
            <CardDescription>
              Every column returned by the profiler. Excluded columns never pass through the model.
            </CardDescription>
          </CardHeader>
          <CardBody className="pt-2">
            <ColumnTable columns={columns} />
          </CardBody>
        </Card>
      </Reveal>

      {/* Configuration */}
      <Reveal>
        <Card size="lg">
          <CardHeader>
            <CardTitle as="h2">Configure run</CardTitle>
            <CardDescription>
              Target column is used for the utility check. Epsilon is your privacy budget.
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-7 pt-3">
            {/* Target */}
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="target-col" className="text-[0.92rem] font-semibold text-ink">
                  Target column
                </label>
                <Badge tone="muted" size="sm">required</Badge>
              </div>
              <p className="mt-1.5 text-[0.84rem] text-ink-2">
                The utility check trains a classifier, so it needs a column to predict. Only
                categorical columns — or numeric columns with 20 or fewer distinct values — can
                be used.
              </p>

              {noTargets ? (
                <div className="mt-4 flex gap-3 rounded-xl border border-warn/25 bg-warn-soft/60 px-4 py-3.5 text-[0.86rem] leading-[1.65] text-ink-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-ink">No column qualifies as a target.</p>
                    <p className="mt-1">
                      The profiler didn’t find any categorical columns, and no numeric column has
                      20 or fewer distinct values. Generation is disabled for this dataset.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative mt-4">
                  <select
                    id="target-col"
                    value={targetCol}
                    onChange={(e) => setTargetCol(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-white px-4 pr-10 text-[0.92rem] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  >
                    {targets.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} · {c.type}
                        {c.unique_count ? ` · ${c.unique_count} unique` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Epsilon */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="epsilon" className="text-[0.92rem] font-semibold text-ink">
                    Epsilon (ε)
                  </label>
                  <Badge tone="brand" size="sm">{Number(epsilon).toFixed(1)}</Badge>
                </div>
                <span className="font-mono text-[0.72rem] text-ink-muted">range 1 – 10</span>
              </div>
              <p className="mt-1.5 text-[0.84rem] leading-[1.65] text-ink-2">
                Lower values mean stronger privacy and softer fidelity. Higher values mean a weaker
                guarantee and better fidelity. This is inherent to DP-SGD, not a setting we
                invented.
              </p>

              <input
                id="epsilon"
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={epsilon}
                onChange={(e) => setEpsilon(Number(e.target.value))}
                className="mt-5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-brand"
              />
              <div className="mt-2 flex justify-between font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-muted">
                <span>stronger privacy</span>
                <span>better fidelity</span>
              </div>
            </div>

            {/* n_rows */}
            <div>
              <label htmlFor="n-rows" className="text-[0.92rem] font-semibold text-ink">
                Number of synthetic rows
              </label>
              <p className="mt-1.5 text-[0.84rem] text-ink-2">
                Optional. Leave blank to let the server decide.
              </p>
              <input
                id="n-rows"
                type="number"
                min={1}
                value={nRows}
                onChange={(e) => setNRows(e.target.value)}
                placeholder="Default"
                className="mt-3 h-11 w-40 rounded-xl border border-line bg-white px-4 font-mono text-[0.92rem] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>

            {error && (
              <ErrorState
                title={error.title}
                message={error.message}
                onRetry={handleGenerate}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <p className="max-w-sm text-[0.82rem] leading-[1.6] text-ink-muted">
                Training runs on the server. You can leave this page — the run keeps going, and
                it’s saved to your History.
              </p>
              <Button
                size="lg"
                onClick={handleGenerate}
                loading={generating}
                disabled={!canGenerate}
              >
                {noTargets ? 'No valid target column' : 'Generate synthetic dataset'}
                {!noTargets && !generating && (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      </Reveal>
    </div>
  );
}

function SummaryStat({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-3">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono text-[1.3rem] font-semibold leading-none ${
          tone === 'brand' ? 'text-brand-3' : tone === 'warn' ? 'text-warn' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ---------------- Column table ---------------- */

function ColumnTable({ columns }) {
  if (!columns?.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2/50">
            {['Column', 'Type', 'Missing', 'Unique', 'PII', 'Will synthesize'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((c, i) => {
            const excluded = c.type === 'identifier' || c.is_pii === true;
            const targetable = isQualifyingTargetColumn(c);
            return (
              <tr key={c.name} className={i % 2 ? 'bg-surface-2/30' : 'bg-white'}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[0.84rem] font-medium text-ink">
                      {c.name}
                    </code>
                    {targetable && (
                      <span
                        title="Can be used as the target column"
                        className="rounded-full border border-brand/25 bg-brand-mist px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-brand-3"
                      >
                        target
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[0.78rem] text-ink-2">{c.type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[0.78rem] text-ink-2">
                  {typeof c.missing_pct === 'number' ? `${c.missing_pct.toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-[0.78rem] text-ink-2">
                  {typeof c.unique_count === 'number' ? c.unique_count.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {c.is_pii ? (
                    <Badge tone="warn" size="sm">PII</Badge>
                  ) : (
                    <span className="font-mono text-[0.72rem] text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {excluded ? (
                    <span
                      title={
                        c.type === 'identifier'
                          ? 'Identifier column — excluded from synthesis'
                          : 'PII column — excluded from synthesis'
                      }
                      className="inline-flex items-center gap-1.5 text-[0.78rem] text-warn"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      Excluded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-brand-3">
                      <Check className="size-3.5" aria-hidden="true" />
                      Yes
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}