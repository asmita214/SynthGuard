// src/components/landing/Comparison.jsx
import { Check, Minus, X, AlertTriangle } from 'lucide-react';
import { Reveal } from '../motion/Reveal';

const ROWS = [
  {
    dimension: 'Re-identification risk',
    real:       { tone: 'bad',  text: 'Direct — any leaked row is a real person.' },
    anonymised: { tone: 'warn', text: 'Reduced, but masking is defeatable by linkage attacks.' },
    synthguard: { tone: 'good', text: 'Bounded by epsilon. Output contains no real rows.' },
  },
  {
    dimension: 'Usefulness for analytics',
    real:       { tone: 'good', text: 'Ground truth.' },
    anonymised: { tone: 'warn', text: 'Degrades with each redaction; groupings often collapse.' },
    synthguard: { tone: 'good', text: 'Preserved on average — utility ratio is measured and reported.' },
  },
  {
    dimension: 'Shareability outside your boundary',
    real:       { tone: 'bad',  text: 'Rarely permissible without heavy legal review.' },
    anonymised: { tone: 'warn', text: 'Still requires review — risk is smaller, not eliminated.' },
    synthguard: { tone: 'good', text: 'Synthetic rows carry no real identities by construction.' },
  },
  {
    dimension: 'Formal guarantee',
    real:       { tone: 'bad',  text: 'None.' },
    anonymised: { tone: 'bad',  text: 'None — “anonymised” is not a mathematical statement.' },
    synthguard: { tone: 'good', text: 'Yes — epsilon from DP-SGD bounds single-record influence.' },
  },
  {
    dimension: 'Depends on dataset size & epsilon',
    real:       { tone: 'good', text: 'Not applicable.' },
    anonymised: { tone: 'warn', text: 'Result quality depends on how much you remove.' },
    synthguard: { tone: 'warn', text: 'Yes — small datasets and low epsilon soften fidelity. Inherent to DP, not a bug.' },
  },
];

const TONES = {
  good: { Icon: Check, cls: 'text-brand-3 bg-brand-mist border-brand/25' },
  warn: { Icon: Minus, cls: 'text-warn bg-warn-soft border-warn/25' },
  bad:  { Icon: X,     cls: 'text-danger bg-danger-soft border-danger/25' },
};

export function Comparison() {
  return (
    <section className="relative section-y">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">An honest comparison</p>
            <h2 className="text-ink">Real. Anonymised. Synthetic.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              No technology replaces real data. The question is what you get to <em>share</em>.
              Below is the tradeoff — including where SynthGuard has real limits.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-14">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card-lg">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2/70">
                    <th className="px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Dimension
                    </th>
                    <th className="px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Real data
                    </th>
                    <th className="px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Anonymised
                    </th>
                    <th className="px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand">
                      SynthGuard
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr
                      key={row.dimension}
                      className={i % 2 ? 'bg-surface-2/40' : 'bg-white'}
                    >
                      <td className="px-6 py-5 align-top text-[0.9rem] font-semibold text-ink">
                        {row.dimension}
                      </td>
                      {['real', 'anonymised', 'synthguard'].map((key) => {
                        const cell = row[key];
                        const { Icon, cls } = TONES[cell.tone];
                        return (
                          <td key={key} className="px-6 py-5 align-top">
                            <div className="flex gap-2.5">
                              <span
                                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${cls}`}
                              >
                                <Icon className="size-3" aria-hidden="true" />
                              </span>
                              <span className="text-[0.86rem] leading-[1.6] text-ink-2">
                                {cell.text}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.18} className="mx-auto mt-8 max-w-3xl">
          <div className="flex gap-4 rounded-2xl border border-warn/25 bg-warn-soft/60 px-6 py-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
            <div>
              <p className="text-[0.9rem] font-semibold text-ink">Limitations, stated plainly.</p>
              <p className="mt-1.5 text-[0.86rem] leading-[1.7] text-ink-2">
                Epsilon is a statistical guarantee — it bounds how much any single record could
                have influenced the output. It is not the same as “zero risk”. Synthetic data
                quality also depends on the size of your dataset and the epsilon you choose;
                small or highly unique datasets will produce softer synthetic data. Identifier
                and PII columns are excluded from synthesis entirely and never pass through
                the model.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}