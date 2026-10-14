// src/components/landing/UseCases.jsx
import { HeartPulse, Landmark, Users, ShoppingBag, GraduationCap } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';

const CASES = [
  {
    icon: HeartPulse,
    title: 'Healthcare',
    body: 'Share patient-pattern data with research partners without exposing identifiable records. Enables cohort studies and method development under an explicit privacy budget.',
    featured: true,
  },
  {
    icon: Landmark,
    title: 'Finance',
    body: 'Distribute realistic transaction patterns for fraud-detection development, without circulating real customer ledgers outside the institution.',
  },
  {
    icon: Users,
    title: 'HR & People Analytics',
    body: 'Run workforce analytics — attrition, compensation bands, hiring funnels — on synthetic employee data no reviewer could trace back to a named person.',
  },
  {
    icon: ShoppingBag,
    title: 'Retail & E-commerce',
    body: 'Hand recommendation and pricing teams a working dataset with the same behavioural structure as live traffic, without leaking purchase history.',
  },
  {
    icon: GraduationCap,
    title: 'Research & Education',
    body: 'Publish datasets alongside papers. Students and external collaborators reproduce analyses on synthetic data — raw records stay where they belong.',
  },
];

export function UseCases() {
  return (
    <section className="relative section-y border-y border-line/60 bg-canvas-2/40">
      <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-40" aria-hidden="true" />

      <div className="page-shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">Where it’s used</p>
            <h2 className="text-ink">
              Horizontal infrastructure.{' '}
              <span className="text-gradient">Applied per industry.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              SynthGuard is not a healthcare product or a fintech product. It’s a data-generation
              layer any team handling sensitive records can adopt. These are patterns, not
              customer endorsements.
            </p>
          </Reveal>
        </div>

        <Stagger
          className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
        >
          {CASES.map(({ icon: Icon, title, body, featured }) => (
            <StaggerItem
              key={title}
              className={featured ? 'lg:col-span-2' : ''}
            >
              <article className="card card-hover relative h-full overflow-hidden p-7">
                {featured && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 size-48 bg-glow-mint opacity-60 blur-3xl"
                  />
                )}
                <div className="relative">
                  <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-ink" style={{ fontSize: '1.15rem' }}>
                    {title}
                  </h3>
                  <p className={`mt-2.5 leading-[1.7] text-ink-2 ${featured ? 'text-[0.96rem] max-w-lg' : 'text-[0.88rem]'}`}>
                    {body}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}