// src/components/landing/Solution.jsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';

const CONCEPTS = [
  { tag: 'VAE',    title: 'Variational Autoencoder',  body: 'Compresses rows into a low-dimensional latent space and reconstructs them, capturing the joint distribution of your columns.' },
  { tag: 'DP-SGD', title: 'Differentially Private SGD', body: 'Clips each per-record gradient and injects calibrated Gaussian noise during every training step.' },
  { tag: 'ε',      title: 'Epsilon',                  body: 'The formal privacy budget. Lower means stronger privacy and softer fidelity — a quantitative tradeoff, not hand-waving.' },
  { tag: 'Utility',title: 'Downstream accuracy',      body: 'A simple classifier is trained on the synthetic rows and tested on the real ones, then compared to a real-trained baseline.' },
];

const FLOW = [
  { label: 'Encode',    sub: 'rows → latent' },
  { label: 'Clip',      sub: 'bounded gradient' },
  { label: 'Noise',     sub: 'calibrated σ' },
  { label: 'Decode',    sub: 'latent → new rows' },
];

export function Solution() {
  return (
    <section className="relative section-y border-y border-line/60 bg-canvas-2/40">
      <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-40" aria-hidden="true" />

      <div className="page-shell relative">
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* Left: prose */}
          <Reveal direction="right">
            <p className="eyebrow mb-4">The approach</p>
            <h2 className="text-ink">
              Learn the <span className="text-gradient">shape</span> of your data, not the rows.
            </h2>

            <div className="prose-synthguard mt-6 max-w-xl">
              <p>
                SynthGuard doesn’t modify your records. It doesn’t hide columns, doesn’t add
                noise to fields, and doesn’t shuffle anything. It discards the originals after
                training and keeps only what it learned about them — the distribution.
              </p>
              <p className="mt-4">
                A neural network compresses every row into a compact internal representation,
                learns the statistical patterns shared across the dataset, and reconstructs
                entirely new rows by drawing fresh samples from that learned space. Each
                synthetic row is a plausible new observation — not a recoloured copy of any
                real one.
              </p>
              <p className="mt-4">
                What makes it <strong>private</strong> rather than merely <em>generative</em>{' '}
                is the training procedure. The optimizer is wrapped in a differential-privacy
                mechanism called <code>DP-SGD</code>: individual gradients are clipped to a
                fixed magnitude, and calibrated Gaussian noise is added at every step. The
                result is a formal, measurable bound — the <code>epsilon (ε)</code> you
                choose — on how much any single real record could have influenced the model.
              </p>
            </div>
          </Reveal>

          {/* Right: concept cards */}
          <Reveal direction="left" delay={0.1}>
            <Stagger className="space-y-3.5" stagger={0.08}>
              {CONCEPTS.map(({ tag, title, body }) => (
                <StaggerItem key={title}>
                  <div className="card card-hover p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full border border-brand/20 bg-brand-mist px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold tracking-[0.06em] uppercase text-brand-3">
                        {tag}
                      </span>
                      <h4 className="text-[0.98rem] font-semibold text-ink">{title}</h4>
                    </div>
                    <p className="mt-2.5 text-[0.88rem] leading-[1.65] text-ink-2">{body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        </div>

        {/* Training loop strip */}
        <Reveal delay={0.15} className="mt-16">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card md:p-7">
            <div className="mb-5 flex items-center justify-between">
              <p className="eyebrow">Training loop</p>
              <span className="font-mono text-[0.68rem] text-ink-faint">
                illustrative
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-4">
              {FLOW.map((step, i) => (
                <div key={step.label} className="flex flex-1 min-w-[120px] items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[0.82rem] font-semibold text-ink">{step.label}</span>
                    <span className="font-mono text-[0.68rem] text-ink-muted">{step.sub}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                      className="hidden flex-1 items-center text-brand/60 md:flex"
                    >
                      <span className="h-px flex-1 bg-gradient-to-r from-line via-brand/40 to-line" />
                      <ArrowRight className="size-3.5 -ml-1" aria-hidden="true" />
                    </motion.span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}