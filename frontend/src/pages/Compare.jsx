// src/pages/Compare.jsx
import { useEffect, useMemo, useState } from 'react';
import { GitCompareArrows, Loader2, Info, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/page/PageHero';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Reveal } from '../components/motion/Reveal';
import { Counter } from '../components/motion/Counter';
import { getCompletedRuns } from '../lib/storage';
import { getJob } from '../lib/api';

export function Compare() {
  const [runs] = useState(() => getCompletedRuns());
  const [leftId, setLeftId] = useState(runs[0]?.job_id ?? '');
  const [rightId, setRightId] = useState(runs[1]?.job_id ?? '');

  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [loading, setLoading] = useState({ left: false, right: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leftId) return;
    setLoading((l) => ({ ...l, left: true }));
    getJob(leftId)
      .then((j) => setLeft(j))
      .catch((err) => setError(err.message))
      .finally(() => setLoading((l) => ({ ...l, left: false })));
  }, [leftId]);

  useEffect(() => {
    if (!rightId) return;
    setLoading((l) => ({ ...l, right: true }));
    getJob(rightId)
      .then((j) => setRight(j))
      .catch((err) => setError(err.message))
      .finally(() => setLoading((l) => ({ ...l, right: false })));
  }, [rightId]);

  if (runs.length < 2) {
    return (
      <>
        <PageHero
          breadcrumb="Compare"
          eyebrow="Side by side"
          title="Two runs, one screen."
          lead="Pick any two completed runs from History and see their metrics next to each other — including the numeric difference between them."
        />
        <section className="page-shell pb-24">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              icon={GitCompareArrows}
              title={runs.length === 0 ? 'No completed runs yet' : 'One more run needed'}
              description={
                runs.length === 0
                  ? "Complete at least two runs in the workspace, then come back here to compare them side by side."
                  : "You have one completed run. Complete a second one to enable comparison."
              }
              action={<Button to="/app">Open Data Workspace</Button>}
            />
          </div>
        </section>
      </>
    );
  }

  const bothLoaded = left?.status === 'completed' && right?.status === 'completed';

  return (
    <>
      <PageHero
        breadcrumb="Compare"
        eyebrow="Side by side"
        title="Two runs, one screen."
        lead="A low-epsilon run next to a high-epsilon run makes the privacy-vs-fidelity tradeoff visible in real numbers."
      />

      <section className="page-shell pb-24">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Pickers */}
          <Reveal>
            <Card>
              <CardBody className="grid gap-5 p-6 md:grid-cols-2">
                <Picker
                  label="Run A"
                  value={leftId}
                  onChange={setLeftId}
                  runs={runs}
                  exclude={rightId}
                  color="brand"
                />
                <Picker
                  label="Run B"
                  value={rightId}
                  onChange={setRightId}
                  runs={runs}
                  exclude={leftId}
                  color="lime"
                />
              </CardBody>
            </Card>
          </Reveal>

          {error && (
            <ErrorState
              title="Couldn't load one of the runs"
              message={error}
            />
          )}

          {/* Metrics comparison */}
          {bothLoaded && (
            <Reveal>
              <div className="space-y-4">
                <MetricRow
                  label="SynthGuard Score"
                  leftValue={Math.round(left.result.synthguard_score)}
                  rightValue={Math.round(right.result.synthguard_score)}
                  format={(v) => `${Math.round(v)}`}
                  higherIsBetter
                  decimals={0}
                />
                <MetricRow
                  label="Fidelity · overall"
                  leftValue={left.result.fidelity.overall}
                  rightValue={right.result.fidelity.overall}
                  format={(v) => v.toFixed(2)}
                  higherIsBetter
                  decimals={2}
                />
                <MetricRow
                  label="Utility · ratio"
                  leftValue={left.result.utility.utility_ratio}
                  rightValue={right.result.utility.utility_ratio}
                  format={(v) => v.toFixed(3)}
                  higherIsBetter
                  decimals={3}
                />
                <MetricRow
                  label="Privacy · avg NN distance"
                  leftValue={left.result.privacy.avg_nearest_neighbor_distance}
                  rightValue={right.result.privacy.avg_nearest_neighbor_distance}
                  format={(v) => v.toFixed(2)}
                  higherIsBetter
                  decimals={2}
                />
                <MetricRow
                  label="Epsilon · achieved"
                  leftValue={left.result.epsilon}
                  rightValue={right.result.epsilon}
                  format={(v) => v.toFixed(1)}
                  higherIsBetter={false}
                  decimals={1}
                  hint="Lower epsilon = stronger privacy, softer fidelity."
                />
              </div>
            </Reveal>
          )}

          {/* Side-by-side headers */}
          {bothLoaded && (
            <Reveal delay={0.08}>
              <div className="grid gap-4 md:grid-cols-2">
                <SideCard job={left} tone="brand" />
                <SideCard job={right} tone="lime" />
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

function Picker({ label, value, onChange, runs, exclude, color }) {
  const tone =
    color === 'brand'
      ? 'border-brand/25 bg-brand-mist/50'
      : 'border-lime/25 bg-lime-soft/50';
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full rounded-xl border px-4 text-[0.92rem] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/15 ${tone}`}
      >
        <option value="">— Select a run —</option>
        {runs
          .filter((r) => r.job_id !== exclude)
          .map((r) => (
            <option key={r.job_id} value={r.job_id}>
              {r.filename} · ε {r.epsilon?.toFixed?.(1) ?? r.epsilon} · {new Date(r.created_at).toLocaleDateString()}
            </option>
          ))}
      </select>
    </div>
  );
}

function MetricRow({
  label,
  leftValue,
  rightValue,
  format,
  higherIsBetter,
  decimals = 0,
  hint,
}) {
  const diff = rightValue - leftValue;
  const abs = Math.abs(diff);
  const leftWins = higherIsBetter ? leftValue > rightValue : leftValue < rightValue;
  const rightWins = higherIsBetter ? rightValue > leftValue : rightValue < leftValue;

  return (
    <Card>
      <CardBody className="grid grid-cols-1 items-center gap-5 p-5 md:grid-cols-[1fr_auto_1fr]">
        {/* Left value */}
        <div className={`rounded-xl border px-5 py-4 text-center ${leftWins ? 'border-brand/25 bg-brand-mist/50' : 'border-line bg-surface-2/40'}`}>
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
            Run A
          </p>
          <p className={`mt-1.5 font-mono font-semibold ${leftWins ? 'text-brand-3' : 'text-ink'}`} style={{ fontSize: '1.6rem' }}>
            <Counter to={leftValue} decimals={decimals} duration={1.4} />
          </p>
        </div>

        {/* Label + difference */}
        <div className="text-center">
          <p className="text-[0.86rem] font-semibold text-ink">{label}</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 font-mono text-[0.72rem] text-ink-2">
            <span>Δ</span>
            <span className={rightWins ? 'text-brand-3' : leftWins ? 'text-warn' : 'text-ink-2'}>
              {diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${format(diff)}`}
            </span>
          </div>
          {hint && (
            <p className="mt-2 max-w-[220px] text-[0.7rem] leading-[1.5] text-ink-muted">
              {hint}
            </p>
          )}
        </div>

        {/* Right value */}
        <div className={`rounded-xl border px-5 py-4 text-center ${rightWins ? 'border-lime/30 bg-lime-soft/60' : 'border-line bg-surface-2/40'}`}>
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
            Run B
          </p>
          <p className={`mt-1.5 font-mono font-semibold ${rightWins ? 'text-lime' : 'text-ink'}`} style={{ fontSize: '1.6rem' }}>
            <Counter to={rightValue} decimals={decimals} duration={1.4} />
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function SideCard({ job, tone }) {
  const score = Math.round(job.result.synthguard_score);
  const accent = tone === 'brand' ? 'text-brand-3' : 'text-lime';
  return (
    <Card className="h-full">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[0.86rem] font-semibold text-ink">
            {job.result.target_col}
          </p>
          <Badge tone={tone === 'brand' ? 'brand' : 'lime'} size="sm">
            ε {job.result.epsilon.toFixed(1)}
          </Badge>
        </div>
        <p className="mt-4 font-mono text-[0.72rem] text-ink-muted">SynthGuard Score</p>
        <p className={`mt-1 font-semibold leading-none tracking-[-0.03em] ${accent}`} style={{ fontSize: '2.4rem' }}>
          {score}
        </p>
        <div className="mt-5 space-y-2 border-t border-line pt-4">
          <Row label="dropped"  value={job.result.dropped_columns?.length ?? 0} />
          <Row label="sample rows" value={job.result.sample_rows?.length ?? 0} />
          <Row label="job id"   value={job.job_id.slice(-10)} mono />
        </div>
      </CardBody>
    </Card>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.78rem] text-ink-muted">{label}</span>
      <span className={`text-[0.82rem] font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}