// src/pages/app/JobPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, Copy,
  Download, FileDown, Share2, Clock, Database, ShieldCheck, Target,
  Fingerprint, TrendingUp, AlertOctagon, Upload as UploadIcon, FileJson, FileText,
  RefreshCw, Circle, Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal } from '../../components/motion/Reveal';
import { Stagger, StaggerItem } from '../../components/motion/Stagger';
import { Counter } from '../../components/motion/Counter';
import {
  FidelityBar, DistributionChart, CategoryChart, CorrelationHeatmap,
} from '../../components/report/Chart';

import { useDataset } from '../../context/DatasetContext';
import { usePolling } from '../../hooks/usePolling';
import { getJob, downloadDataset, ApiError } from '../../lib/api';
import { updateRun, getRun } from '../../lib/storage';
import {
  downloadRowsAsCsv, downloadRowsAsJson, sanitizeFilename,
  parseCsvFile,
} from '../../lib/csv';
import {
  buildHistogram, buildCategoryFrequency, buildCorrelationMatrix,
  subtractMatrix, numericValues,
} from '../../lib/stats';

const EASE = [0.16, 1, 0.3, 1];

/* ================================================================== */

export function JobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dataset = useDataset();

  const { job, status, error, elapsedMs, elapsedLabel, isStale, restart } = usePolling(jobId, {
    onCompleted: (j) => {
      updateRun(jobId, {
        status: 'completed',
        synthguard_score: j.result?.synthguard_score ?? null,
        epsilon_achieved: j.result?.epsilon ?? null,
        duration_ms: Date.now() - (getRun(jobId)?.created_at
          ? new Date(getRun(jobId).created_at).getTime()
          : Date.now()),
      });
      toast.success('Run complete');
    },
    onFailed: (j) => {
      updateRun(jobId, { status: 'failed', error: j.error ?? 'Unknown failure' });
    },
  });

  const phase = status ?? (job ? job.status : 'pending');
  const isRunning = phase === 'pending' || phase === 'running';
  const isComplete = phase === 'completed';
  const isFailed = phase === 'failed';

  return (
    <div className="page-shell pb-24 pt-12">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
          <Link to="/app" className="transition-colors hover:text-brand-3">Workspace</Link>
          <span>/</span>
          <span className="truncate text-brand-3">{jobId?.slice(0, 22)}…</span>
        </div>

        <AnimatePresence mode="wait">
          {isRunning && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <ProgressState
                jobId={jobId}
                elapsedMs={elapsedMs}
                elapsedLabel={elapsedLabel}
                isStale={isStale}
                error={error}
                onRetry={restart}
                onStartNew={() => navigate('/app')}
              />
            </motion.div>
          )}

          {isFailed && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <FailedState
                job={job}
                onRetry={() => {
                  dataset.setPendingConfig?.({
                    targetCol: job?.result?.target_col,
                    epsilon: job?.result?.epsilon,
                  });
                  navigate('/app');
                }}
              />
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <ResultsState
                job={job}
                jobId={jobId}
                elapsedMs={elapsedMs}
                onRunAgain={() => {
                  dataset.setPendingConfig?.({
                    targetCol: job?.result?.target_col,
                    epsilon: job?.result?.epsilon,
                  });
                  navigate('/app');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Progress                                                            */
/* ================================================================== */

const PROGRESS_MESSAGES = [
  { label: 'Encoding rows',              sub: 'compressing your dataset into a latent representation' },
  { label: 'Clipping gradients',         sub: 'capping each per-record gradient so no single row dominates' },
  { label: 'Adding calibrated noise',    sub: 'DP-SGD injecting Gaussian noise at every step' },
  { label: 'Training the decoder',       sub: 'learning to reconstruct rows from the latent space' },
  { label: 'Sampling the latent space',  sub: 'drawing fresh points for new synthetic rows' },
  { label: 'Decoding categoricals',      sub: 'argmax reconstruction of class probabilities' },
];

function ProgressState({ jobId, elapsedMs, elapsedLabel, isStale, error, onRetry, onStartNew }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const msg = PROGRESS_MESSAGES[msgIndex];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card size="lg">
        <CardBody className="p-10">
          <div className="flex flex-col items-center text-center">
            {/* Spinner */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-glow-mint opacity-60 blur-2xl" aria-hidden="true" />
              <div className="relative flex size-24 items-center justify-center rounded-full border border-line bg-white shadow-float">
                <Loader2 className="size-8 animate-spin text-brand" aria-hidden="true" />
              </div>
            </div>

            <Badge tone="brand" size="md" className="mb-4">
              <span className="relative flex size-1.5 items-center justify-center">
                <span className="absolute size-1.5 rounded-full bg-brand pulse-dot" />
              </span>
              {isStale ? 'Still running' : 'Training in progress'}
            </Badge>

            <h1 className="text-ink" style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
              {isStale ? 'This run is taking longer than expected.' : 'Generating your synthetic dataset.'}
            </h1>

            <AnimatePresence mode="wait">
              <motion.div
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="mt-3 max-w-md"
              >
                <p className="text-[0.98rem] font-medium text-ink-2">{msg.label}</p>
                <p className="mt-0.5 text-[0.85rem] text-ink-muted">{msg.sub}</p>
              </motion.div>
            </AnimatePresence>

            {/* Elapsed */}
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-2/60 px-4 py-2">
              <Clock className="size-3.5 text-ink-muted" aria-hidden="true" />
              <span className="font-mono text-[0.86rem] font-medium text-ink tabular-nums">
                {elapsedLabel}
              </span>
              <span className="text-ink-faint">elapsed</span>
            </div>

            <p className="mt-3 font-mono text-[0.68rem] text-ink-faint">
              job {jobId}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Stale message */}
      {isStale && (
        <div className="flex gap-3 rounded-2xl border border-warn/25 bg-warn-soft/60 px-5 py-4 text-[0.88rem] leading-[1.7] text-ink-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">The run has been going for more than 15 minutes.</p>
            <p className="mt-1">
              This can happen on Render’s free tier, where the server may restart mid-run. We
              can’t confirm the job failed — it may still complete. You can keep waiting, or
              start a fresh run with the same dataset.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Keep checking
              </Button>
              <Button variant="outline" size="sm" onClick={onStartNew}>
                Start a new run
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transient polling error */}
      {error && !isStale && (
        <div className="flex gap-3 rounded-2xl border border-warn/25 bg-warn-soft/50 px-5 py-4 text-[0.86rem] text-ink-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
          <div className="flex-1">
            <p>We lost contact with the server for a moment. We’ll keep trying.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 text-[0.82rem] font-medium text-brand-3 underline underline-offset-4"
            >
              Retry now
            </button>
          </div>
        </div>
      )}

      {/* Expectations */}
      <div className="grid gap-3 md:grid-cols-3">
        <ExpectationCard label="Typically 1–3 minutes" sub="Small datasets finish faster" />
        <ExpectationCard label="Polling every 3 seconds" sub="Slows to 6s after two minutes" />
        <ExpectationCard label="Safe to leave this page" sub="The run continues server-side" />
      </div>
    </div>
  );
}

function ExpectationCard({ label, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <p className="text-[0.86rem] font-medium text-ink">{label}</p>
      <p className="mt-1 text-[0.78rem] text-ink-muted">{sub}</p>
    </div>
  );
}

/* ================================================================== */
/* Failed                                                              */
/* ================================================================== */

function FailedState({ job, onRetry }) {
  return (
    <div className="space-y-6">
      <ErrorState
        title="This run failed"
        message={job?.error || 'The server reported a failure without a message.'}
        onRetry={onRetry}
        retryLabel="Try again"
        secondary={
          <Button to="/app" variant="ghost" size="sm">
            Back to workspace
          </Button>
        }
      />
      <Card>
        <CardBody className="p-6">
          <p className="text-[0.86rem] leading-[1.7] text-ink-2">
            Common causes of a failed run: the target column had too few distinct values, the
            epsilon was too aggressive for the number of rows, or training diverged. Trying
            again with a slightly higher epsilon (or more training rows) usually resolves it.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

/* ================================================================== */
/* Results                                                             */
/* ================================================================== */

function ResultsState({ job, jobId, elapsedMs, onRunAgain }) {
  const result = job?.result;
  const score = result?.synthguard_score ?? 0;
  const grade = gradeFor(score);

  const [downloadingFull, setDownloadingFull] = useState(false);
  const [syntheticRows, setSyntheticRows] = useState(null);
  const dataset = useDataset();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy — copy the address bar manually.");
    }
  };

  const fetchFull = async () => {
    if (syntheticRows) return syntheticRows;
    setDownloadingFull(true);
    try {
      const rows = await downloadDataset(jobId);
      setSyntheticRows(rows);
      return rows;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : 'Download failed.');
      return null;
    } finally {
      setDownloadingFull(false);
    }
  };

  const handleDownloadCsv = async () => {
    const rows = await fetchFull();
    if (!rows) return;
    const name = sanitizeFilename(dataset.filename || 'synthguard');
    downloadRowsAsCsv(rows, `${name}-synthetic-${jobId.slice(-6)}.csv`);
    toast.success('CSV downloading');
  };

  const handleDownloadJson = async () => {
    const rows = await fetchFull();
    if (!rows) return;
    const name = sanitizeFilename(dataset.filename || 'synthguard');
    downloadRowsAsJson(rows, `${name}-synthetic-${jobId.slice(-6)}.json`);
    toast.success('JSON downloading');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <Card size="lg">
          <CardBody className="p-7">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-brand/25 bg-brand-mist text-brand-3">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{dataset.filename || 'Run completed'}</p>
                    <Badge tone="brand" size="sm">Complete</Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[0.72rem] text-ink-muted">
                    {jobId}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm" onClick={onRunAgain}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Run again
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                  <Share2 className="size-3.5" aria-hidden="true" />
                  Copy link
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetaItem label="Target"     value={result?.target_col ?? '—'} mono />
              <MetaItem label="ε achieved" value={typeof result?.epsilon === 'number' ? result.epsilon.toFixed(1) : '—'} mono />
              <MetaItem label="Duration"   value={formatDuration(elapsedMs)} mono />
              <MetaItem label="Score"      value={typeof score === 'number' ? Math.round(score) : '—'} mono />
            </div>
          </CardBody>
        </Card>
      </Reveal>

      {/* Score */}
      <Reveal>
        <Card size="lg" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-80 bg-glow-mint opacity-50 blur-3xl"
          />
          <CardBody className="relative p-8">
            <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
              <ScoreRing value={Math.round(score)} />
              <div>
                <p className="eyebrow mb-3">SynthGuard Score</p>
                <div className="flex flex-wrap items-baseline gap-4">
                  <span className="text-gradient font-semibold leading-none tracking-[-0.045em]" style={{ fontSize: '3rem' }}>
                    <Counter to={Math.round(score)} duration={2.1} />
                  </span>
                  <span className="rounded-full border border-brand/25 bg-brand-mist px-3 py-1 font-semibold uppercase tracking-[0.1em] text-brand-3" style={{ fontSize: '0.7rem' }}>
                    {grade}
                  </span>
                </div>
                <p className="mt-3 text-[0.9rem] leading-[1.7] text-ink-2">
                  Weighted composite of fidelity (40%), utility (30%), privacy (30%).
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Reveal>

      {/* Fidelity */}
      <Reveal>
        <Card size="lg">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Target className="size-4 text-brand" aria-hidden="true" />
              <CardTitle as="h2">Fidelity · {((result?.fidelity?.overall ?? 0) * 100).toFixed(0)}% overall</CardTitle>
            </div>
            <CardDescription>
              Per-column distribution similarity. Numeric columns use a Kolmogorov–Smirnov
              comparison; categorical columns use a normalized distance between frequency tables.
            </CardDescription>
          </CardHeader>
          <CardBody className="pt-3">
            <div className="space-y-5">
              {Object.entries(result?.fidelity ?? {})
                .filter(([k]) => k !== 'overall')
                .map(([name, value], i) => (
                  <FidelityBar key={name} label={name} value={value} delay={i * 0.06} />
                ))}
            </div>
          </CardBody>
        </Card>
      </Reveal>

      {/* Utility + Privacy */}
      <div className="grid gap-5 md:grid-cols-2">
        <Reveal>
          <Card size="lg" className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="size-4 text-brand" aria-hidden="true" />
                <CardTitle as="h2">Utility</CardTitle>
              </div>
              <CardDescription>
                A classifier trained on synthetic rows, tested on real rows.
              </CardDescription>
            </CardHeader>
            <CardBody className="pt-3">
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="real_acc"  value={`${((result?.utility?.real_accuracy ?? 0) * 100).toFixed(0)}%`} />
                <StatTile label="synth_acc" value={`${((result?.utility?.synthetic_accuracy ?? 0) * 100).toFixed(0)}%`} />
                <StatTile
                  label="ratio"
                  value={(result?.utility?.utility_ratio ?? 0).toFixed(3)}
                  highlight
                />
              </div>
            </CardBody>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card size="lg" className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Fingerprint className="size-4 text-brand" aria-hidden="true" />
                <CardTitle as="h2">Privacy</CardTitle>
              </div>
              <CardDescription>
                {result?.privacy?.note || 'Average L2 distance from each synthetic row to its closest real row.'}
              </CardDescription>
            </CardHeader>
            <CardBody className="pt-3">
              <div className="flex items-baseline gap-3">
                <span className="text-gradient text-4xl font-semibold leading-none tracking-[-0.03em]">
                  <Counter
                    to={result?.privacy?.avg_nearest_neighbor_distance ?? 0}
                    decimals={2}
                    duration={1.8}
                  />
                </span>
                <span className="font-mono text-[0.78rem] text-ink-muted">avg NN dist</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatTile
                  label="ε achieved"
                  value={typeof result?.epsilon === 'number' ? result.epsilon.toFixed(1) : '—'}
                />
                <StatTile label="formula" value="bounded" highlight />
              </div>
            </CardBody>
          </Card>
        </Reveal>
      </div>

      {/* Dropped + jointly */}
      {(result?.dropped_columns?.length > 0 || result?.target_jointly_modeled === false) && (
        <Reveal>
          <Card size="lg">
            <CardBody className="space-y-5 p-6">
              {result?.dropped_columns?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="size-4 text-warn" aria-hidden="true" />
                    <p className="font-semibold text-ink">Columns excluded from synthesis</p>
                  </div>
                  <p className="mt-2 text-[0.86rem] leading-[1.7] text-ink-2">
                    These columns were typed <code>identifier</code> or flagged as PII. They
                    never passed through the generative model.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.dropped_columns.map((c) => (
                      <span
                        key={c}
                        className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[0.82rem] text-ink-2"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result?.target_jointly_modeled === false && (
                <div className="flex gap-3 rounded-xl border border-info/25 bg-info-soft/60 px-4 py-3.5 text-[0.86rem] leading-[1.7] text-ink-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
                  <p>
                    The target column was resampled independently rather than generated jointly
                    with the other columns. This happens when the target itself is a column type
                    the model cannot synthesize jointly (identifier, text, datetime, or PII).
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </Reveal>
      )}

      {/* Sample rows */}
      {result?.sample_rows?.length > 0 && (
        <Reveal>
          <Card size="lg" className="overflow-hidden">
            <CardHeader className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle as="h2">Sample rows</CardTitle>
                <CardDescription>
                  Preview of the first {result.sample_rows.length} synthetic rows.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadCsv}
                  loading={downloadingFull}
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  Download CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadJson}
                  loading={downloadingFull}
                >
                  <FileJson className="size-3.5" aria-hidden="true" />
                  Download JSON
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2/50">
                    {Object.keys(result.sample_rows[0]).map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-ink-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sample_rows.map((row, i) => (
                    <tr key={i} className={i % 2 ? 'bg-surface-2/30' : 'bg-white'}>
                      {Object.entries(row).map(([k, v]) => (
                        <td key={k} className="px-5 py-2.5 font-mono text-[0.82rem] text-ink">
                          {v === null || v === undefined
                            ? '—'
                            : typeof v === 'number'
                              ? (Number.isInteger(v) ? v : v.toFixed(3))
                              : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}

      {/* Real-vs-synthetic comparison */}
      <Reveal>
        <ComparisonSection
          job={job}
          jobId={jobId}
          syntheticRows={syntheticRows}
          onLoadSynthetic={fetchFull}
        />
      </Reveal>
    </div>
  );
}

/* ---------------- Real-vs-synth comparison ---------------- */

function ComparisonSection({ job, jobId, syntheticRows, onLoadSynthetic }) {
  const dataset = useDataset();
  const [rows, setRows] = useState(syntheticRows);
  const [loading, setLoading] = useState(false);
  const [reattachError, setReattachError] = useState(null);
  const reattachRef = useRef(null);

  useEffect(() => {
    if (syntheticRows && !rows) setRows(syntheticRows);
  }, [syntheticRows, rows]);

  const realRows = dataset.rows;
  const columns = dataset.columns ?? [];

  const numericCols = useMemo(() => {
    if (!realRows?.length) return [];
    return columns.filter((c) => {
      const v = realRows.slice(0, 50).map((r) => r[c]).filter((x) => typeof x === 'number');
      return v.length >= 5;
    });
  }, [realRows, columns]);

  const categoricalCols = useMemo(() => {
    if (!realRows?.length) return [];
    return columns.filter((c) => {
      const vals = new Set();
      for (const r of realRows.slice(0, 100)) {
        if (r[c] !== undefined && r[c] !== null) vals.add(r[c]);
        if (vals.size > 30) return false;
      }
      return vals.size >= 2 && vals.size <= 30;
    });
  }, [realRows, columns]);

  const handleLoadSynthetic = async () => {
    setLoading(true);
    const r = await onLoadSynthetic();
    if (r) setRows(r);
    setLoading(false);
  };

  const handleReattach = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReattachError(null);
    try {
      const parsed = await parseCsvFile(f);
      dataset.setParsedCsv({ rows: parsed.rows, columns: parsed.columns });
    } catch (err) {
      setReattachError(err.message);
    }
  };

  const canRender = realRows?.length > 0 && rows?.length > 0;

  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle as="h2">Real vs synthetic comparison</CardTitle>
        <CardDescription>
          Per-column distributions and joint structure, computed in your browser.
        </CardDescription>
      </CardHeader>
      <CardBody className="pt-3">
        {!realRows?.length && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-info/25 bg-info-soft/60 px-5 py-4">
            <UploadIcon className="size-4 shrink-0 text-info" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-[0.88rem] leading-[1.7] text-ink-2">
                The original CSV isn’t in memory anymore (this is common after a page reload).
                Re-attach it to unlock the real-vs-synthetic charts — everything else on this
                page is already available.
              </p>
              {reattachError && (
                <p className="mt-2 text-[0.82rem] text-danger">{reattachError}</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => reattachRef.current?.click()}
            >
              Re-attach CSV
            </Button>
            <input
              ref={reattachRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleReattach}
            />
          </div>
        )}

        {realRows?.length > 0 && !rows && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/50 px-5 py-4">
            <p className="text-[0.88rem] leading-[1.7] text-ink-2">
              Load the full synthetic dataset to build real-vs-synthetic charts. The full
              download is only fetched when you ask for it.
            </p>
            <Button variant="secondary" size="sm" onClick={handleLoadSynthetic} loading={loading}>
              <Download className="size-3.5" aria-hidden="true" />
              Load synthetic rows
            </Button>
          </div>
        )}

        {canRender && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {numericCols.slice(0, 4).map((c, i) => {
                const realVals = numericValues(realRows, c);
                const synthVals = numericValues(rows, c);
                const hist = buildHistogram(realVals, synthVals, 18);
                return (
                  <DistributionChart
                    key={c}
                    title={c}
                    bins={hist.bins}
                  />
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {categoricalCols.slice(0, 2).map((c) => {
                const items = buildCategoryFrequency(realRows, rows, c, 10);
                return <CategoryChart key={c} title={c} items={items} />;
              })}
            </div>

            {numericCols.length >= 2 && (
              <div className="grid gap-4 lg:grid-cols-3">
                <CorrelationHeatmap
                  title="Real"
                  columns={numericCols.slice(0, 4)}
                  matrix={buildCorrelationMatrix(realRows, numericCols.slice(0, 4))}
                />
                <CorrelationHeatmap
                  title="Synthetic"
                  columns={numericCols.slice(0, 4)}
                  matrix={buildCorrelationMatrix(rows, numericCols.slice(0, 4))}
                />
                <CorrelationHeatmap
                  title="Drift (|real − synth|)"
                  columns={numericCols.slice(0, 4)}
                  matrix={subtractMatrix(
                    buildCorrelationMatrix(realRows, numericCols.slice(0, 4)),
                    buildCorrelationMatrix(rows, numericCols.slice(0, 4)),
                  )}
                  mode="absolute"
                />
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ================================================================== */
/* Small shared sub-components                                         */
/* ================================================================== */

function MetaItem({ label, value, mono }) {
  return (
    <div>
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 text-[0.9rem] font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function StatTile({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        highlight ? 'border-brand/25 bg-brand-mist/50' : 'border-line bg-surface-2/50'
      }`}
    >
      <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-mono font-semibold ${highlight ? 'text-brand-3' : 'text-ink'}`}
        style={{ fontSize: '1.05rem' }}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreRing({ value }) {
  const size = 144;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/60 to-lime-300/60 blur-2xl"
      />
      <svg width={size} height={size} className="relative -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="job-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#065f46" />
            <stop offset="55%"  stopColor="#059669" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e9efe4" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#job-ring-grad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, delay: 0.3, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gradient font-semibold leading-none tracking-[-0.05em]" style={{ fontSize: '2.3rem' }}>
            <Counter to={value} duration={2} delay={0.3} />
          </p>
          <p className="mt-1 font-mono text-[0.58rem] font-medium uppercase tracking-[0.14em] text-ink-muted">
            out of 100
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Utilities                                                           */
/* ================================================================== */

function gradeFor(score) {
  if (typeof score !== 'number') return '—';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Weak';
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`;
}