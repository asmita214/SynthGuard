// src/components/landing/Dimensions.jsx
import { motion } from 'framer-motion';
import { Gauge, Target, Fingerprint } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';
import { Counter } from '../motion/Counter';

const EASE = [0.16, 1, 0.3, 1];

const DIMENSIONS = [
  {
    icon: Gauge,
    name: 'Fidelity',
    weight: 40,
    tag: '40% of score',
    lead: 'How closely each column’s distribution matches the original.',
    detail: 'Numeric columns are compared with a Kolmogorov–Smirnov style test. Categorical columns use a normalized distance between frequency tables. The overall fidelity is the aggregate across synthesized columns.',
    metric: 'result.fidelity.overall',
    accent: 'from-brand to-brand-2',
  },
  {
    icon: Target,
    name: 'Utility',
    weight: 30,
    tag: '30% of score',
    lead: 'How useful the synthetic data is for downstream modeling.',
    detail: 'A classifier is trained on synthetic rows and tested on real rows. A second classifier is trained on real rows and tested the same way. Utility ratio is synthetic accuracy divided by real accuracy — 1.0 means parity.',
    metric: 'result.utility.utility_ratio',
    accent: 'from-brand-2 to-lime-bright',
  },
  {
    icon: Fingerprint,
    name: 'Privacy',
    weight: 30,
    tag: '30% of score',
    lead: 'How far synthetic rows sit from real ones, plus the formal guarantee.',
    detail: 'The heuristic component is average nearest-neighbor distance between synthetic and real rows. The formal component is epsilon — the DP-SGD budget that bounds single-record influence.',
    metric: 'result.privacy.avg_nearest_neighbor_distance',
    accent: 'from-brand-3 to-brand',
  },
];

export function Dimensions() {
  return (
    <section className="relative section-y border-y border-line/60 bg-canvas-2/40">
      <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-40" aria-hidden="true" />

      <div className="page-shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">How a run is judged</p>
            <h2 className="text-ink">Three dimensions. One honest score.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              Every completed run is measured on fidelity, utility and privacy. The SynthGuard
              Score is a fixed weighted composite —{' '}
              <strong className="font-semibold text-ink">
                40% fidelity, 30% utility, 30% privacy
              </strong>{' '}
              — so you always know what moved it.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid gap-5 md:grid-cols-3" stagger={0.12}>
          {DIMENSIONS.map(({ icon: Icon, name, weight, tag, lead, detail, metric, accent }) => (
            <StaggerItem key={name}>
              <article className="card card-hover relative h-full p-7">
                <div className="flex items-start justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[0.66rem] font-medium tracking-[0.08em] uppercase text-ink-muted">
                    {tag}
                  </span>
                </div>

                <h3 className="mt-5 text-ink" style={{ fontSize: '1.4rem' }}>
                  {name}
                </h3>
                <p className="mt-2 text-[0.94rem] leading-[1.6] font-medium text-ink">{lead}</p>
                <p className="mt-3.5 text-[0.86rem] leading-[1.7] text-ink-2">{detail}</p>

                {/* Weight visualization */}
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${weight}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 1.1, ease: EASE }}
                      className={`h-full rounded-full bg-gradient-to-r ${accent}`}
                    />
                  </div>
                  <span className="font-mono text-[0.72rem] font-semibold text-ink-2">
                    <Counter to={weight} duration={1.1} />%
                  </span>
                </div>

                <p className="mt-4 font-mono text-[0.68rem] text-ink-faint">{metric}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}