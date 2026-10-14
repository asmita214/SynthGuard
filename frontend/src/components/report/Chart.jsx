// src/components/report/Chart.jsx
//
// Chart primitives used by /sample-report and (later) the live results page.
// SVG-based so we don't pull a chart library for these simple visuals.
// All accept static data and animate in on mount.

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';

const EASE = [0.16, 1, 0.3, 1];

/* ------------------------------------------------------------------ */
/* Horizontal fidelity bar with a value on the right                  */
/* ------------------------------------------------------------------ */

export function FidelityBar({ label, value, max = 1, delay = 0, sublabel }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[0.82rem] font-medium text-ink">{label}</span>
          {sublabel && (
            <span className="font-mono text-[0.68rem] text-ink-faint">{sublabel}</span>
          )}
        </div>
        <span className="font-mono text-[0.82rem] font-semibold text-ink-2">
          {value.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          initial={{ width: reduce ? `${pct}%` : 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.1, delay, ease: EASE }}
          className="h-full rounded-full bg-gradient-to-r from-brand to-lime-bright"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Real vs synthetic distribution — paired mini bars per bin          */
/* ------------------------------------------------------------------ */

export function DistributionChart({
  title,
  bins,
  height = 96,
  legend = true,
  className,
}) {
  const reduce = useReducedMotion();
  const maxReal = Math.max(...bins.map((b) => b.real));
  const maxSynth = Math.max(...bins.map((b) => b.synth));
  const max = Math.max(maxReal, maxSynth, 1);

  return (
    <div className={cn('rounded-2xl border border-line bg-white p-5 shadow-card', className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[0.82rem] font-semibold text-ink">{title}</p>
        {legend && (
          <div className="flex items-center gap-3">
            <Legend color="bg-brand" label="Real" />
            <Legend color="bg-lime-bright" label="Synth" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-[3px]" style={{ height }}>
        {bins.map((bin, i) => (
          <div key={i} className="flex h-full flex-1 items-end gap-[2px]">
            <motion.div
              initial={{ height: reduce ? `${(bin.real / max) * 100}%` : 0 }}
              whileInView={{ height: `${(bin.real / max) * 100}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: i * 0.02, ease: EASE }}
              className="flex-1 rounded-sm bg-brand"
              style={{ minHeight: 2 }}
            />
            <motion.div
              initial={{ height: reduce ? `${(bin.synth / max) * 100}%` : 0 }}
              whileInView={{ height: `${(bin.synth / max) * 100}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: i * 0.02 + 0.05, ease: EASE }}
              className="flex-1 rounded-sm bg-lime-bright"
              style={{ minHeight: 2 }}
            />
          </div>
        ))}
      </div>

      {bins[0]?.label && (
        <div className="mt-3 flex justify-between font-mono text-[0.66rem] text-ink-faint">
          <span>{bins[0].label}</span>
          <span>{bins[bins.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Category frequency — horizontal grouped bars                        */
/* ------------------------------------------------------------------ */

export function CategoryChart({ title, items, className }) {
  const reduce = useReducedMotion();
  const max = Math.max(...items.flatMap((it) => [it.real, it.synth]), 1);

  return (
    <div className={cn('rounded-2xl border border-line bg-white p-5 shadow-card', className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[0.82rem] font-semibold text-ink">{title}</p>
        <div className="flex items-center gap-3">
          <Legend color="bg-brand" label="Real" />
          <Legend color="bg-lime-bright" label="Synth" />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-[0.78rem] font-medium text-ink-2">{item.key}</span>
              <div className="flex gap-3 font-mono text-[0.68rem]">
                <span className="text-ink-muted">{(item.realPct).toFixed(1)}%</span>
                <span className="text-brand-3">{(item.synthPct).toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-1.5 space-y-1">
              <Bar pct={(item.real / max) * 100}  delay={i * 0.03} className="bg-brand" />
              <Bar pct={(item.synth / max) * 100} delay={i * 0.03 + 0.05} className="bg-lime-bright" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ pct, delay, className }) {
  const reduce = useReducedMotion();
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
      <motion.div
        initial={{ width: reduce ? `${pct}%` : 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
        className={cn('h-full rounded-full', className)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Correlation heatmap — square grid of colored cells                  */
/* ------------------------------------------------------------------ */

export function CorrelationHeatmap({ title, columns, matrix, mode = 'signed', className }) {
  const reduce = useReducedMotion();

  // Colour for a value in [-1, 1]. `signed` shows red→white→green.
  // `absolute` shows white→emerald.
  function cellColor(v) {
    if (typeof v !== 'number') return 'bg-surface-2';
    if (mode === 'absolute') {
      const a = Math.abs(v);
      if (a < 0.15) return 'bg-surface-2';
      if (a < 0.35) return 'bg-brand-mist';
      if (a < 0.55) return 'bg-brand-soft';
      if (a < 0.75) return 'bg-brand-2';
      return 'bg-brand';
    }
    // signed
    if (v < -0.5)  return 'bg-danger';
    if (v < -0.2)  return 'bg-danger/50';
    if (v < 0.2)   return 'bg-surface-2';
    if (v < 0.5)   return 'bg-brand-mist';
    if (v < 0.75)  return 'bg-brand-2';
    return 'bg-brand';
  }

  return (
    <div className={cn('rounded-2xl border border-line bg-white p-5 shadow-card', className)}>
      <p className="mb-4 font-mono text-[0.82rem] font-semibold text-ink">{title}</p>

      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-block">
          {/* Header row */}
          <div className="flex">
            <div className="w-20 shrink-0" />
            {columns.map((c) => (
              <div key={c} className="flex w-12 shrink-0 items-end justify-center pb-1.5">
                <span className="font-mono text-[0.6rem] font-medium text-ink-muted [writing-mode:vertical-rl] rotate-180 truncate max-h-16">
                  {c}
                </span>
              </div>
            ))}
          </div>

          {/* Body rows */}
          {columns.map((row, ri) => (
            <div key={row} className="flex items-center">
              <div className="w-20 shrink-0 pr-2 text-right">
                <span className="font-mono text-[0.64rem] font-medium text-ink-muted truncate">
                  {row}
                </span>
              </div>
              {columns.map((col, ci) => {
                const v = matrix[row]?.[col];
                return (
                  <motion.div
                    key={col}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.4, delay: (ri * columns.length + ci) * 0.012, ease: EASE }}
                    className={cn(
                      'm-[1px] flex size-11 shrink-0 items-center justify-center rounded-md',
                      cellColor(v),
                    )}
                    title={`${row} × ${col}: ${typeof v === 'number' ? v.toFixed(2) : '—'}`}
                  >
                    <span
                      className={cn(
                        'font-mono text-[0.58rem] font-medium',
                        typeof v === 'number' && Math.abs(v) > 0.55 ? 'text-white' : 'text-ink-2',
                      )}
                    >
                      {typeof v === 'number' ? v.toFixed(2).replace(/^0\./, '.') : '—'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-ink-muted">
      <span className={cn('size-2 rounded-sm', color)} />
      {label}
    </span>
  );
}