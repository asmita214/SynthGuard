// src/components/landing/Pipeline.jsx
import { Upload, ScanSearch, ShieldCheck, Sparkles, BadgeCheck } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';

const STAGES = [
  { n: '01', icon: Upload,      title: 'Upload',      body: 'You hand SynthGuard a CSV. It stays on the server only for the duration of that session.' },
  { n: '02', icon: ScanSearch,  title: 'Profile',     body: 'Columns are typed — numeric, categorical, identifier, text, datetime — and PII columns are flagged for exclusion.' },
  { n: '03', icon: ShieldCheck, title: 'Train (DP)',  body: 'The VAE is trained under DP-SGD: gradient clipping plus calibrated noise. You choose epsilon before this starts.' },
  { n: '04', icon: Sparkles,    title: 'Generate',    body: 'New rows are sampled from the latent space and reconstructed. Categorical columns are decoded via argmax.' },
  { n: '05', icon: BadgeCheck,  title: 'Validate',    body: 'Fidelity, utility and privacy are measured on the output. You get per-column scores and a SynthGuard Score.' },
];

export function Pipeline() {
  return (
    <section className="relative section-y">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">The pipeline</p>
            <h2 className="text-ink">Five stages, one session.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              What actually happens between uploading a CSV and getting a synthetic dataset back.
              Every stage below is a real call to the backend — nothing invented.
            </p>
          </Reveal>
        </div>

        <Stagger
          className="mt-16 grid gap-4 md:grid-cols-3 lg:grid-cols-5"
          stagger={0.1}
        >
          {STAGES.map(({ n, icon: Icon, title, body }) => (
            <StaggerItem key={n}>
              <article className="card card-hover group relative h-full overflow-hidden p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-5 top-4 font-mono text-[0.9rem] font-semibold text-line-strong transition-colors duration-300 group-hover:text-brand/40"
                >
                  {n}
                </span>
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-ink">{title}</h3>
                <p className="mt-2.5 text-[0.86rem] leading-[1.65] text-ink-2">{body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}