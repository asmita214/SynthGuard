// src/components/landing/Problem.jsx
import { Eye, GitBranch, Scale } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';

const PROBLEMS = [
  {
    icon: Eye,
    title: 'Masking is not anonymisation',
    body: 'Removing names and IDs doesn’t stop re-identification. Linkage attacks across “harmless” fields routinely re-attach real identities to supposedly anonymised rows.',
  },
  {
    icon: GitBranch,
    title: 'Sharing across teams is risky',
    body: 'The moment sensitive data leaves your boundary — a vendor, a partner, a research group, a demo environment — you inherit a new class of risk that policy alone cannot remove.',
  },
  {
    icon: Scale,
    title: 'Compliance is a bottleneck',
    body: 'HIPAA, GDPR and internal review boards exist because raw records carry legal weight. Every request for real data becomes a negotiation, a delay, and a paper trail.',
  },
];

export function Problem() {
  return (
    <section className="relative section-y">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">The problem</p>
            <h2 className="text-ink">
              You can’t share what you can’t un-share.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              Real data powers analytics, model training and research — and it’s the single
              most dangerous artifact your team handles. The usual answer, anonymise and
              redact, is a promise you cannot always keep.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <article className="card card-hover h-full p-7">
                <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-ink">{title}</h3>
                <p className="mt-3 text-[0.92rem] leading-[1.7] text-ink-2">{body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}