// src/pages/History.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Clock, Database, Loader2, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { PageHero } from '../components/page/PageHero';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { getRuns, deleteRun, clearRuns } from '../lib/storage';

export function History() {
  const [runs, setRuns] = useState(() => getRuns());

  const handleDelete = (jobId) => {
    deleteRun(jobId);
    setRuns(getRuns());
  };

  const handleClear = () => {
    if (!window.confirm('Clear all saved runs from this browser? This cannot be undone.')) return;
    clearRuns();
    setRuns([]);
  };

  return (
    <>
      <PageHero
        breadcrumb="History"
        eyebrow="This browser only"
        title="Every run you’ve started here."
        lead="Runs are tracked in your browser’s localStorage. Nothing about them lives on a server until you open one — opening a run re-fetches its live state from the backend."
      />

      <section className="page-shell pb-24">
        <div className="mx-auto max-w-4xl">
          {runs.length === 0 ? (
            <Reveal>
              <EmptyState
                icon={Inbox}
                title="No runs yet"
                description="Once you complete a run in the workspace, it’ll show up here — with its filename, target, epsilon and SynthGuard Score."
                action={
                  <Button to="/app" size="md">
                    Open Data Workspace
                  </Button>
                }
              />
            </Reveal>
          ) : (
            <>
              <Reveal>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-[0.88rem] text-ink-2">
                    {runs.length} {runs.length === 1 ? 'run' : 'runs'} saved
                  </p>
                  <Button variant="danger" size="sm" onClick={handleClear}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Clear all
                  </Button>
                </div>
              </Reveal>

              <Stagger className="space-y-3" stagger={0.06}>
                {runs.map((run) => (
                  <StaggerItem key={run.job_id}>
                    <RunRow run={run} onDelete={handleDelete} />
                  </StaggerItem>
                ))}
              </Stagger>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function RunRow({ run, onDelete }) {
  const status = run.status ?? 'pending';

  return (
    <Card interactive className="overflow-hidden">
      <CardBody className="flex flex-wrap items-center gap-4 p-5">
        <StatusIcon status={status} />

        <Link to={`/app/job/${run.job_id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink">{run.filename}</p>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 truncate font-mono text-[0.72rem] text-ink-muted">
            {run.job_id}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.72rem] text-ink-muted">
            <span>target: {run.target_col || '—'}</span>
            <span>ε: {run.epsilon?.toFixed?.(1) ?? run.epsilon ?? '—'}</span>
            <span>{new Date(run.created_at).toLocaleString()}</span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          {typeof run.synthguard_score === 'number' && (
            <div className="text-right">
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Score
              </p>
              <p className="mt-0.5 text-gradient font-semibold leading-none tracking-[-0.03em]" style={{ fontSize: '1.35rem' }}>
                {Math.round(run.synthguard_score)}
              </p>
            </div>
          )}

          <Link
            to={`/app/job/${run.job_id}`}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-[0.78rem] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand-3"
          >
            Open
          </Link>

          <button
            type="button"
            onClick={() => onDelete(run.job_id)}
            className="flex size-8 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors hover:border-danger/30 hover:text-danger"
            aria-label="Delete run"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

function StatusIcon({ status }) {
  if (status === 'completed') {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-brand/25 bg-brand-mist text-brand-3">
        <CheckCircle2 className="size-4" aria-hidden="true" />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-danger/25 bg-danger-soft text-danger">
        <XCircle className="size-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-warn/25 bg-warn-soft text-warn">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: { tone: 'brand', label: 'Complete' },
    failed:    { tone: 'danger', label: 'Failed' },
    running:   { tone: 'warn', label: 'Running' },
    pending:   { tone: 'muted', label: 'Pending' },
  };
  const { tone, label } = map[status] ?? map.pending;
  return <Badge tone={tone} size="sm">{label}</Badge>;
}