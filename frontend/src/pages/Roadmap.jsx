// src/pages/Roadmap.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2, KeyRound, Users, LineChart, CalendarClock, ArrowRight, Check, Sparkles,
} from 'lucide-react';
import { PageHero } from '../components/page/PageHero';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { saveRoadmapEmail, getRoadmapEmail } from '../lib/storage';

const ITEMS = [
  {
    icon: FileCheck2,
    title: 'AI-generated compliance certificate',
    body: 'A downloadable PDF summarising a run — epsilon used, fidelity/utility/privacy metrics, column exclusions, and a plain-language description of the DP guarantee. Intended to accompany data shared with a partner or review board.',
  },
  {
    icon: KeyRound,
    title: 'API keys for programmatic access',
    body: 'Long-lived keys so teams can run SynthGuard from their own pipelines rather than through the workspace UI. Scoped per workspace, with usage logs.',
  },
  {
    icon: Users,
    title: 'Team workspaces and login',
    body: 'Shared history, role-based access to datasets and runs, and a workspace-level view of every job the team has executed.',
  },
  {
    icon: LineChart,
    title: 'Time-series data support',
    body: 'A dedicated model variant for datasets with temporal structure — sequences, seasonality and lag features — rather than the tabular VAE used today.',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled regeneration',
    body: 'Point SynthGuard at a dataset and a schedule. New synthetic samples land in your storage on a cadence, with each run scored and logged.',
  },
];

export function Roadmap() {
  const [email, setEmail] = useState(getRoadmapEmail() ?? '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // NOTE: This saves the email to localStorage only. There is deliberately no
    // fetch() here and no backend endpoint. See src/lib/storage.js.
    const ok = saveRoadmapEmail(email);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    }
  };

  return (
    <>
      <PageHero
        breadcrumb="Roadmap"
        eyebrow="Coming soon"
        title="What is next — and what is not shipped yet."
        lead="Every item on this page is explicitly not available today. When something ships, it moves out of this list and into the product."
      />

      {/* Items */}
      <section className="section-y-sm">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl">
            <Stagger className="space-y-4" stagger={0.1}>
              {ITEMS.map(({ icon: Icon, title, body }) => (
                <StaggerItem key={title}>
                  <article className="card card-hover flex gap-5 p-6">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[1.05rem] font-semibold text-ink">{title}</h3>
                        <span className="rounded-full border border-warn/25 bg-warn-soft px-2.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-warn">
                          Coming soon
                        </span>
                      </div>
                      <p className="mt-2 text-[0.9rem] leading-[1.7] text-ink-2">{body}</p>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Email capture — local only */}
      <section className="section-y-sm border-t border-line/60 bg-canvas-2/40">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-8 shadow-card-lg md:p-10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-mist text-brand-3">
                  <Sparkles className="size-4" aria-hidden="true" />
                </div>
                <p className="eyebrow">Stay in the loop</p>
              </div>

              <h2 className="mt-5 text-ink" style={{ fontSize: '1.75rem' }}>
                Get notified when these ship.
              </h2>
              <p className="mt-3 text-[0.95rem] leading-[1.7] text-ink-2">
                Leave an email and we’ll let you know when the next feature lands. In this build,
                your address is saved to your own browser only — nothing is submitted anywhere.
              </p>

              <form onSubmit={handleSubmit} className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourteam.com"
                    className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-[0.92rem] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[0.9rem] font-medium text-white transition-colors hover:bg-brand-3"
                  >
                    {saved ? (
                      <>
                        <Check className="size-4" aria-hidden="true" />
                        Saved locally
                      </>
                    ) : (
                      <>
                        Notify me
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
                  {/* This does NOT submit anywhere. Purely a localStorage save for this demo build. */}
                  Stored in this browser only · no backend call
                </p>
              </form>

              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-center gap-2.5 rounded-xl border border-brand/20 bg-brand-mist/60 px-4 py-3 text-[0.85rem] text-brand-3"
                >
                  <Check className="size-4" aria-hidden="true" />
                  Thanks — we’ve got it saved on your device.
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}