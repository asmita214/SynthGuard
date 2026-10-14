// src/components/landing/Hero.jsx
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Play, ShieldCheck, Activity, Database, Lock, Check, TrendingUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Counter } from '../motion/Counter';

const EASE = [0.16, 1, 0.3, 1];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

const TRUST = [
  { icon: ShieldCheck, label: 'DP-SGD' },
  { icon: Activity,    label: 'Variational Autoencoder' },
  { icon: Database,    label: 'Statistical validation' },
  { icon: Lock,        label: 'Zero raw records' },
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dots-fade opacity-55" />

      {!reduce && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-48 -top-40 size-[720px] rounded-full bg-glow-mint opacity-70 blur-3xl animate-float-slow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-1/3 size-[480px] rounded-full bg-glow-brand opacity-45 blur-3xl animate-float-mid"
          />
        </>
      )}

      <div className="page-shell relative pb-32 pt-16 md:pb-40 md:pt-24">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-20">
          {/* ======================= LEFT — copy ======================= */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="relative z-10 max-w-xl"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/75 px-3 py-1.5 backdrop-blur-sm shadow-soft">
                <span className="relative flex size-1.5 items-center justify-center">
                  <span className="absolute size-1.5 rounded-full bg-brand pulse-dot" />
                </span>
                <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.16em] text-brand-3">
                  Privacy-preserving ML infrastructure
                </span>
              </span>
            </motion.div>

            {/* Headline — forced clean 2-line wrap */}
            <motion.h1 variants={item} className="mt-7 text-ink">
              Share the signal.
              <br />
              <span className="text-gradient">Never the people</span> in it.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-7 max-w-lg text-[1.02rem] leading-[1.7] text-ink-2"
            >
              SynthGuard trains a{' '}
              <strong className="font-semibold text-ink">differentially private</strong>{' '}
              generative model on your CSV, then produces a new dataset with the same
              statistical shape and{' '}
              <strong className="font-semibold text-ink">zero real records</strong>. Every
              run arrives with a fidelity, utility and privacy report attached.
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/app" size="lg">
                Launch Data Workspace
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button to="/sample-report" size="lg" variant="secondary">
                <Play className="size-3.5 text-brand" aria-hidden="true" />
                View sample report
              </Button>
            </motion.div>

            <motion.ul variants={item} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-[0.82rem] text-ink-muted">
                  <Icon className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* ======================= RIGHT — report card ======================= */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE }}
            className="relative"
          >
            <ReportCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Report card                                                         */
/* ================================================================== */

function ReportCard() {
  return (
    <div className="relative">
      {/* Ambient glow field — bigger, softer, sits behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-[44px] bg-gradient-to-br from-emerald-200/70 via-lime-200/50 to-teal-200/60 opacity-90 blur-3xl"
      />

      {/* ============ FLOATING PILLS — placed OUTSIDE the card ============ */}

      {/* ε — top-left, above the card */}
      <motion.div
        initial={{ opacity: 0, y: -14, x: -14 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
        className="absolute -left-4 -top-5 z-20 hidden md:block"
      >
        <Pill icon="ε" label="Epsilon" value="5.0" tone="brand" />
      </motion.div>

      {/* Rows — top-right, above the card */}
      <motion.div
        initial={{ opacity: 0, y: -14, x: 14 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
        className="absolute -right-4 -top-5 z-20 hidden md:block"
      >
        <Pill icon={<TrendingUp className="size-4" />} label="Synthetic rows" value="3,000" tone="lime" />
      </motion.div>

      {/* Zero real records — bottom-left, below the card */}
      <motion.div
        initial={{ opacity: 0, y: 14, x: -14 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.8, delay: 1.35, ease: EASE }}
        className="absolute -bottom-6 -left-4 z-20 hidden md:block"
      >
        <Pill icon={<Check className="size-4" />} label="Real records" value="0" tone="brand" />
      </motion.div>

      {/* ============================ CARD ============================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-float"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-1.5 items-center justify-center">
              <span className="absolute size-1.5 rounded-full bg-brand pulse-dot" />
            </span>
            <span className="font-mono text-[0.7rem] text-ink-muted">
              job_4a7f…c9e2
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-mist px-2.5 py-0.5">
            <Check className="size-3 text-brand-3" aria-hidden="true" />
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-brand-3">
              Complete
            </span>
          </span>
        </div>

        {/* Score + ring */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-6 px-6 py-7">
          <ScoreRing value={87} delay={0.9} />
          <div>
            <p className="eyebrow">SynthGuard Score</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="font-semibold text-ink" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                Excellent
              </span>
              <span className="rounded-full border border-brand/20 bg-brand-mist px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-3">
                85+
              </span>
            </div>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-ink-muted">
              40% fidelity · 30% utility · 30% privacy
            </p>
          </div>
        </div>

        {/* Metric bars */}
        <div className="space-y-4 border-t border-line px-6 py-6">
          <MetricBar label="Fidelity" value={92} delay={1.2} />
          <MetricBar label="Utility"  value={81} delay={1.35} />
          <MetricBar label="Privacy"  value={84} delay={1.5} />
        </div>

        {/* Distribution preview */}
        <div className="border-t border-line bg-surface-2/40 px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Distribution preview
            </span>
            <div className="flex items-center gap-3">
              <Legend color="bg-brand" label="Real" />
              <Legend color="bg-lime-bright" label="Synthetic" />
            </div>
          </div>
          <DistributionPreview />
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 border-t border-line">
          <FooterStat label="Dropped" value="2" />
          <FooterStat label="Columns" value="6" />
          <FooterStat label="Duration" value="1m 12s" last />
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/* Sub-components                                                      */
/* ================================================================== */

function Pill({ icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: { box: 'bg-brand-mist', text: 'text-brand-3' },
    lime:  { box: 'bg-lime-soft',  text: 'text-lime' },
  };
  const t = tones[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-3.5 py-2.5 shadow-card-lg backdrop-blur-sm">
      <div className={`flex size-8 items-center justify-center rounded-xl ${t.box} ${t.text}`}>
        <span className="text-[0.92rem] font-semibold">{icon}</span>
      </div>
      <div className="leading-tight">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          {label}
        </p>
        <p className="font-mono text-[0.9rem] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function ScoreRing({ value = 87, delay = 0.9 }) {
  const reduce = useReducedMotion();
  const size = 108;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Soft glow behind ring */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/60 to-lime-300/60 blur-xl"
      />

      <svg width={size} height={size} className="relative -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#047857" />
            <stop offset="55%"  stopColor="#059669" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e9efe4" strokeWidth={stroke}
        />

        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#ring-grad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, delay, ease: EASE }}
        />
      </svg>

      {/* Number in the middle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gradient font-semibold leading-none" style={{ fontSize: '2.1rem', letterSpacing: '-0.05em' }}>
          <Counter to={value} duration={2.1} delay={delay} />
        </span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.82rem] font-medium text-ink">{label}</span>
        <span className="font-mono text-[0.78rem] font-medium text-ink-2">
          <Counter to={value} duration={1.4} delay={delay} />
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          initial={{ width: reduce ? `${value}%` : 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.4, delay, ease: EASE }}
          className="h-full rounded-full bg-gradient-to-r from-brand to-lime-bright"
        />
      </div>
    </div>
  );
}

/* Small real-vs-synthetic distribution preview — static mock, animates on mount */
function DistributionPreview() {
  const reduce = useReducedMotion();
  const real = [42, 68, 91, 78, 55, 38, 22];
  const synth = [38, 62, 88, 82, 60, 42, 26];
  const max = Math.max(...real, ...synth);
  const height = 46;

  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {real.map((r, i) => {
        const s = synth[i];
        return (
          <div key={i} className="flex h-full flex-1 items-end gap-[3px]">
            <motion.div
              initial={{ height: reduce ? `${(r / max) * 100}%` : 0 }}
              animate={{ height: `${(r / max) * 100}%` }}
              transition={{ duration: 0.85, delay: 1.6 + i * 0.05, ease: EASE }}
              className="flex-1 rounded-sm bg-brand"
              style={{ minHeight: 3 }}
            />
            <motion.div
              initial={{ height: reduce ? `${(s / max) * 100}%` : 0 }}
              animate={{ height: `${(s / max) * 100}%` }}
              transition={{ duration: 0.85, delay: 1.65 + i * 0.05, ease: EASE }}
              className="flex-1 rounded-sm bg-lime-bright"
              style={{ minHeight: 3 }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-medium text-ink-muted">
      <span className={`size-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function FooterStat({ label, value, last = false }) {
  return (
    <div className={`px-5 py-3.5 ${last ? '' : 'border-r border-line'}`}>
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-[0.92rem] font-semibold text-ink">{value}</p>
    </div>
  );
}