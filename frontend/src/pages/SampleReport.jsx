// src/pages/SampleReport.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Info, ArrowRight, Download, Share2, RotateCcw, CheckCircle2,
  AlertTriangle, Copy, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { PageHero } from '../components/page/PageHero';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Counter } from '../components/motion/Counter';
import {
  FidelityBar, DistributionChart, CategoryChart, CorrelationHeatmap,
} from '../components/report/Chart';

/* ================================================================== */
/* STATIC MOCK DATA — clearly fictional                                */
/* ================================================================== */

const SAMPLE = {
  job_id: 'job_sample_4a7f3e1c9b2d',
  filename: 'retail_sample.csv',
  target_col: 'category',
  epsilon: 5.0,
  duration_label: '1m 12s',
  synthguard_score: 87,
  grade: 'Excellent',
  fidelity: {
    overall: 0.92,
    columns: [
      { name: 'quantity',    value: 0.94, type: 'numeric' },
      { name: 'unit_price',  value: 0.89, type: 'numeric' },
      { name: 'total_price', value: 0.91, type: 'numeric' },
      { name: 'category',    value: 0.93, type: 'categorical' },
    ],
  },
  utility: {
    real_accuracy: 0.87,
    synthetic_accuracy: 0.71,
    utility_ratio: 0.816,
  },
  privacy: {
    avg_nearest_neighbor_distance: 3.42,
    note: 'Average L2 distance from each synthetic row to its closest real row.',
  },
  dropped_columns: ['store_id', 'customer_id'],
  target_jointly_modeled: true,
  sample_rows: [
    { quantity: 3, unit_price: 4.19, total_price: 12.57, category: 'Beverages' },
    { quantity: 1, unit_price: 2.49, total_price: 2.49,  category: 'Snacks' },
    { quantity: 6, unit_price: 7.85, total_price: 47.10, category: 'Household' },
    { quantity: 2, unit_price: 5.30, total_price: 10.60, category: 'Dairy' },
    { quantity: 4, unit_price: 3.10, total_price: 12.40, category: 'Produce' },
  ],
  row_count: 3000,
  column_count: 6,
};

/* Distribution mock — 18 bins per numeric column */
const DIST_QUANTITY = Array.from({ length: 18 }, (_, i) => ({
  real:  Math.round(30 + Math.sin(i / 2.3) * 35 + (i < 3 || i > 15 ? -18 : 0) + (i * 2.1)),
  synth: Math.round(28 + Math.sin(i / 2.3) * 32 + (i < 3 || i > 15 ? -16 : 0) + (i * 2)),
  label: `${i}`,
}));

const DIST_UNIT_PRICE = Array.from({ length: 18 }, (_, i) => ({
  real:  Math.round(15 + Math.exp(-((i - 6) ** 2) / 18) * 85 + i * 0.8),
  synth: Math.round(14 + Math.exp(-((i - 6.4) ** 2) / 18) * 80 + i * 0.7),
  label: `${(i * 0.9 + 0.5).toFixed(1)}`,
}));

const DIST_TOTAL_PRICE = Array.from({ length: 18 }, (_, i) => ({
  real:  Math.round(10 + Math.exp(-((i - 4) ** 2) / 12) * 90 + i * 0.4),
  synth: Math.round(9 + Math.exp(-((i - 4.2) ** 2) / 12) * 86 + i * 0.35),
  label: `${(i * 2.5 + 1).toFixed(0)}`,
}));

const CATEGORY_ITEMS = [
  { key: 'Beverages',     real: 712, synth: 698, realPct: 23.7, synthPct: 23.3 },
  { key: 'Snacks',        real: 604, synth: 612, realPct: 20.1, synthPct: 20.4 },
  { key: 'Household',     real: 481, synth: 472, realPct: 16.0, synthPct: 15.7 },
  { key: 'Produce',       real: 447, synth: 456, realPct: 14.9, synthPct: 15.2 },
  { key: 'Personal Care', real: 419, synth: 408, realPct: 14.0, synthPct: 13.6 },
  { key: 'Dairy',         real: 337, synth: 354, realPct: 11.2, synthPct: 11.8 },
];

/* Correlation matrices */
const CORR_COLS = ['quantity', 'unit_price', 'total_price', 'category_idx'];
const REAL_CORR = {
  quantity:      { quantity: 1.00, unit_price: -0.06, total_price: 0.42, category_idx: 0.03 },
  unit_price:    { quantity: -0.06, unit_price: 1.00, total_price: 0.71, category_idx: 0.38 },
  total_price:   { quantity: 0.42, unit_price: 0.71, total_price: 1.00, category_idx: 0.29 },
  category_idx:  { quantity: 0.03, unit_price: 0.38, total_price: 0.29, category_idx: 1.00 },
};
const SYNTH_CORR = {
  quantity:      { quantity: 1.00, unit_price: -0.04, total_price: 0.39, category_idx: 0.05 },
  unit_price:    { quantity: -0.04, unit_price: 1.00, total_price: 0.68, category_idx: 0.35 },
  total_price:   { quantity: 0.39, unit_price: 0.68, total_price: 1.00, category_idx: 0.26 },
  category_idx:  { quantity: 0.05, unit_price: 0.35, total_price: 0.26, category_idx: 1.00 },
};
const CORR_DRIFT = (() => {
  const out = {};
  for (const r of CORR_COLS) {
    out[r] = {};
    for (const c of CORR_COLS) {
      out[r][c] = Math.abs((REAL_CORR[r]?.[c] ?? 0) - (SYNTH_CORR[r]?.[c] ?? 0));
    }
  }
  return out;
})();

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */

export function SampleReport() {
  return (
    <>
      <PageHero
        breadcrumb="Sample report"
        eyebrow="Example output"
        title="What a completed run looks like."
        lead="Every number below comes from a fictional retail dataset. Nothing is wired to a live backend — this page exists so you know what to expect before uploading your own CSV."
      />

      {/* Prominent Sample Data banner */}
      <section className="page-shell">
        <Reveal>
          <div className="mx-auto mb-6 flex max-w-4xl items-center gap-3 rounded-2xl border border-info/25 bg-info-soft/60 px-5 py-4">
            <Info className="size-4 shrink-0 text-info" aria-hidden="true" />
            <p className="text-[0.88rem] leading-[1.6] text-ink-2">
              <strong className="font-semibold text-ink">Sample data.</strong> The dataset,
              metrics, and charts on this page are static mockups. No backend call was made.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Run header */}
      <section className="page-shell">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <RunHeader />
          </div>
        </Reveal>
      </section>

      {/* Score hero */}
      <section className="page-shell mt-6">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <ScoreHero />
          </div>
        </Reveal>
      </section>

      {/* Metric panels */}
      <section className="page-shell mt-6">
        <Reveal>
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
            <MetricPanel
              title="Fidelity"
              weight="40%"
              primary={`${SAMPLE.fidelity.overall.toFixed(2)}`}
              primaryLabel="overall"
              secondary="per-column distribution similarity"
            />
            <MetricPanel
              title="Utility"
              weight="30%"
              primary={`${SAMPLE.utility.utility_ratio.toFixed(3)}`}
              primaryLabel="ratio"
              secondary={`${(SAMPLE.utility.synthetic_accuracy * 100).toFixed(0)}% synthetic · ${(SAMPLE.utility.real_accuracy * 100).toFixed(0)}% real`}
            />
            <MetricPanel
              title="Privacy"
              weight="30%"
              primary={SAMPLE.privacy.avg_nearest_neighbor_distance.toFixed(2)}
              primaryLabel="avg NN dist"
              secondary={`ε = ${SAMPLE.epsilon.toFixed(1)}`}
            />
          </div>
        </Reveal>
      </section>

      {/* Per-column fidelity */}
      <section className="page-shell mt-16">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <div className="card p-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow mb-2">Fidelity · per column</p>
                  <h2 className="text-ink" style={{ fontSize: '1.5rem' }}>
                    Every synthesized column scores above 0.88.
                  </h2>
                  <p className="mt-2 max-w-xl text-[0.9rem] leading-[1.7] text-ink-2">
                    Numeric columns use a Kolmogorov–Smirnov style comparison. Categorical
                    columns use normalized distance between frequency tables. 1.00 is a perfect
                    match.
                  </p>
                </div>
                <Badge tone="brand" size="md" className="shrink-0">
                  {SAMPLE.fidelity.overall.toFixed(2)} overall
                </Badge>
              </div>

              <div className="mt-7 space-y-5">
                {SAMPLE.fidelity.columns.map((c, i) => (
                  <FidelityBar
                    key={c.name}
                    label={c.name}
                    sublabel={c.type}
                    value={c.value}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Distribution comparisons */}
      <section className="page-shell mt-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-6">
              <p className="eyebrow mb-2">Distributions</p>
              <h2 className="text-ink">Real vs synthetic, column by column.</h2>
              <p className="mt-2 max-w-xl text-[0.95rem] leading-[1.7] text-ink-2">
                Each pair of bars shows the same bin in the real dataset and in the synthetic
                output. Similar heights mean the distribution survived the DP training.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-4 md:grid-cols-2" stagger={0.1}>
            <StaggerItem>
              <DistributionChart title="quantity"    bins={DIST_QUANTITY} />
            </StaggerItem>
            <StaggerItem>
              <DistributionChart title="unit_price"  bins={DIST_UNIT_PRICE} />
            </StaggerItem>
            <StaggerItem>
              <DistributionChart title="total_price" bins={DIST_TOTAL_PRICE} />
            </StaggerItem>
            <StaggerItem>
              <CategoryChart title="category (frequency)" items={CATEGORY_ITEMS} />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Utility & Privacy detail */}
      <section className="page-shell mt-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-6">
              <p className="eyebrow mb-2">Utility & privacy detail</p>
              <h2 className="text-ink">How well the synthetic data performs — and how far it sits.</h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="card h-full p-6">
                <p className="font-mono text-[0.82rem] font-semibold text-ink">Utility</p>
                <p className="mt-2 text-[0.86rem] leading-[1.7] text-ink-2">
                  A simple classifier was trained on synthetic rows and tested on real rows.
                  The same architecture was trained on real rows for a baseline.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <UtilityStat
                    label="real_acc"
                    value={(SAMPLE.utility.real_accuracy * 100).toFixed(0)}
                    suffix="%"
                  />
                  <UtilityStat
                    label="synth_acc"
                    value={(SAMPLE.utility.synthetic_accuracy * 100).toFixed(0)}
                    suffix="%"
                  />
                  <UtilityStat
                    label="ratio"
                    value={SAMPLE.utility.utility_ratio.toFixed(3)}
                    highlight
                  />
                </div>

                <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4 text-[0.82rem] leading-[1.65] text-ink-2">
                  Ratio close to 1.0 means the synthetic data is nearly as predictive as the
                  real data for this task.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="card h-full p-6">
                <p className="font-mono text-[0.82rem] font-semibold text-ink">Privacy</p>
                <p className="mt-2 text-[0.86rem] leading-[1.7] text-ink-2">
                  {SAMPLE.privacy.note}
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-gradient text-5xl font-semibold leading-none tracking-[-0.04em]">
                    <Counter to={SAMPLE.privacy.avg_nearest_neighbor_distance} decimals={2} duration={1.8} />
                  </span>
                  <span className="font-mono text-[0.82rem] text-ink-muted">
                    avg nearest-neighbor distance
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-surface-2/60 p-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      ε achieved
                    </p>
                    <p className="mt-1 font-mono text-[1.15rem] font-semibold text-ink">
                      {SAMPLE.epsilon.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-brand-mist/60 p-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="size-3 text-brand-3" aria-hidden="true" />
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-brand-3">
                        Formal guarantee
                      </p>
                    </div>
                    <p className="mt-1 text-[0.82rem] font-medium text-ink">
                      Bounded by ε
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-[0.78rem] leading-[1.6] text-ink-muted">
                  Nearest-neighbor distance is a heuristic. Epsilon is the formal guarantee —
                  the two are reported side by side, not substituted for each other.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Correlation matrix */}
      <section className="page-shell mt-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-6">
              <p className="eyebrow mb-2">Joint structure</p>
              <h2 className="text-ink">The relationships between columns, preserved.</h2>
              <p className="mt-2 max-w-xl text-[0.95rem] leading-[1.7] text-ink-2">
                Per-column fidelity is one thing. What matters for downstream modeling is
                whether the columns still move together the same way. Pearson correlation,
                computed on real and synthetic rows separately.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-4 lg:grid-cols-3" stagger={0.1}>
            <StaggerItem>
              <CorrelationHeatmap title="Real" columns={CORR_COLS} matrix={REAL_CORR} />
            </StaggerItem>
            <StaggerItem>
              <CorrelationHeatmap title="Synthetic" columns={CORR_COLS} matrix={SYNTH_CORR} />
            </StaggerItem>
            <StaggerItem>
              <CorrelationHeatmap
                title="Drift (|real − synth|)"
                columns={CORR_COLS}
                matrix={CORR_DRIFT}
                mode="absolute"
              />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Dropped columns */}
      <section className="page-shell mt-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="border-b border-line bg-surface-2/50 px-7 py-5">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 text-warn" aria-hidden="true" />
                  <p className="font-semibold text-ink">Columns excluded from synthesis</p>
                </div>
                <p className="mt-1.5 text-[0.86rem] text-ink-2">
                  These columns were typed <code>identifier</code> or flagged as PII. They never
                  passed through the generative model.
                </p>
              </div>

              <div className="divide-y divide-line">
                {SAMPLE.dropped_columns.map((col) => (
                  <div key={col} className="flex items-center justify-between px-7 py-4">
                    <code className="font-mono text-[0.88rem] font-medium text-ink">{col}</code>
                    <Badge tone="warn" size="sm">
                      {col === 'customer_id' ? 'PII · identifier' : 'identifier'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sample rows */}
      <section className="page-shell mt-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-2/50 px-7 py-5">
                <div>
                  <p className="font-semibold text-ink">Sample rows</p>
                  <p className="mt-1 text-[0.86rem] text-ink-2">
                    Preview of the first 5 synthetic rows. The full dataset has{' '}
                    {SAMPLE.row_count.toLocaleString()} rows.
                  </p>
                </div>
                <Badge tone="muted" size="sm">
                  {SAMPLE.row_count.toLocaleString()} generated
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-white">
                      {['quantity', 'unit_price', 'total_price', 'category'].map((h) => (
                        <th
                          key={h}
                          className="px-7 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-ink-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE.sample_rows.map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 ? 'bg-surface-2/40' : 'bg-white'}
                      >
                        <td className="px-7 py-3 font-mono text-[0.82rem] text-ink">{row.quantity}</td>
                        <td className="px-7 py-3 font-mono text-[0.82rem] text-ink">{row.unit_price.toFixed(2)}</td>
                        <td className="px-7 py-3 font-mono text-[0.82rem] text-ink">{row.total_price.toFixed(2)}</td>
                        <td className="px-7 py-3 text-[0.85rem] text-ink-2">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Actions + CTA */}
      <section className="section-y">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-4xl">
              <div className="rounded-3xl border border-line bg-white p-8 shadow-card-lg md:p-10">
                <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
                  <div>
                    <p className="eyebrow mb-3">Try it on your own data</p>
                    <h2 className="text-ink" style={{ fontSize: '1.75rem' }}>
                      This report took 1m 12s. Yours will too.
                    </h2>
                    <p className="mt-3 max-w-lg text-[0.95rem] leading-[1.7] text-ink-2">
                      No install, no signup. Bring a CSV, choose epsilon, and you get a real
                      report card — with the same numbers, computed on your data.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <Button to="/app" size="lg" className="md:w-full">
                      Launch Data Workspace
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                    <Button to="/how-it-works" size="lg" variant="secondary" className="md:w-full">
                      Read the pipeline docs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ================================================================== */
/* Sub-components                                                      */
/* ================================================================== */

function RunHeader() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">{SAMPLE.filename}</p>
              <Badge tone="brand" size="sm">Sample</Badge>
            </div>
            <p className="mt-0.5 font-mono text-[0.72rem] text-ink-muted">
              {SAMPLE.job_id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <MetaItem label="Target"  value={SAMPLE.target_col} mono />
          <MetaItem label="ε"       value={SAMPLE.epsilon.toFixed(1)} mono />
          <MetaItem label="Duration" value={SAMPLE.duration_label} mono />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono = false }) {
  return (
    <div className="leading-tight">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 text-[0.9rem] font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function ScoreHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-8 shadow-card-lg md:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-80 bg-glow-mint opacity-50 blur-3xl"
      />

      <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <ScoreRing value={SAMPLE.synthguard_score} />

        <div>
          <p className="eyebrow mb-3">SynthGuard Score</p>
          <div className="flex flex-wrap items-baseline gap-4">
            <span className="text-gradient font-semibold leading-none tracking-[-0.045em]" style={{ fontSize: '3.5rem' }}>
              <Counter to={SAMPLE.synthguard_score} duration={2.2} />
            </span>
            <span className="rounded-full border border-brand/25 bg-brand-mist px-3 py-1 font-semibold uppercase tracking-[0.1em] text-brand-3" style={{ fontSize: '0.72rem' }}>
              {SAMPLE.grade}
            </span>
          </div>
          <p className="mt-4 max-w-lg text-[0.95rem] leading-[1.7] text-ink-2">
            A weighted composite of fidelity (40%), utility (30%) and privacy (30%). Grades: 85+
            Excellent, 70–84 Good, 50–69 Fair, below 50 Weak.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value }) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/50 to-lime-300/50 blur-2xl"
      />
      <svg width={size} height={size} className="relative -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="sample-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#065f46" />
            <stop offset="55%"  stopColor="#059669" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e9efe4" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#sample-ring-grad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gradient font-semibold leading-none tracking-[-0.05em]" style={{ fontSize: '2.6rem' }}>
            <Counter to={value} duration={2.2} delay={0.3} />
          </p>
          <p className="mt-1 font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-ink-muted">
            out of 100
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricPanel({ title, weight, primary, primaryLabel, secondary }) {
  return (
    <div className="card card-hover p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">{title}</p>
        <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
          {weight}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-gradient text-4xl font-semibold leading-none tracking-[-0.03em]">
          {primary}
        </p>
        <p className="mt-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-muted">
          {primaryLabel}
        </p>
      </div>

      <p className="mt-4 text-[0.82rem] leading-[1.6] text-ink-2">{secondary}</p>
    </div>
  );
}

function UtilityStat({ label, value, suffix = '', highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        highlight
          ? 'border-brand/25 bg-brand-mist/50'
          : 'border-line bg-surface-2/50'
      }`}
    >
      <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono font-semibold ${highlight ? 'text-brand-3' : 'text-ink'}`} style={{ fontSize: '1.1rem' }}>
        {value}{suffix}
      </p>
    </div>
  );
}