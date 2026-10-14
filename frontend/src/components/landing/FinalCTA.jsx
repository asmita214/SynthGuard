// src/components/landing/FinalCTA.jsx
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../motion/Reveal';

export function FinalCTA() {
  return (
    <section className="relative section-y">
      <div className="page-shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-brand-deep px-8 py-16 md:px-16 md:py-20 shadow-float">
            {/* Ambient light blooms inside the dark panel */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-emerald-500/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-lime-400/20 blur-3xl"
            />

            {/* Fine dot grid */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
                backgroundSize: '28px 28px',
                maskImage:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
              }}
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-brand-soft backdrop-blur-sm">
                <Sparkles className="size-3" aria-hidden="true" />
                Ready in one CSV
              </span>

              <h2
                className="mt-6 text-white"
                style={{
                  fontSize: 'clamp(2rem, 2.4vw + 1rem, 3.25rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.06,
                }}
              >
                Generate your first private dataset in minutes.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-[1rem] leading-[1.7] text-emerald-100/85">
                No install. No signup. Bring a CSV, choose epsilon, and watch a synthetic
                version come out — with its own report card attached.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/app"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[0.92rem] font-semibold text-brand-deep shadow-lg transition-all duration-200 hover:bg-brand-soft active:translate-y-px"
                >
                  Launch Data Workspace
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/sample-report"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 text-[0.92rem] font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/10"
                >
                  See a sample report
                </Link>
              </div>

              <p className="mt-6 font-mono text-[0.72rem] text-emerald-200/70">
                Your dataset is used for one training session only.{' '}
                <Link to="/privacy" className="underline underline-offset-4 hover:text-white">
                  Privacy notes
                </Link>
                .
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}