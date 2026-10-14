// src/components/page/PageHero.jsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';

const EASE = [0.16, 1, 0.3, 1];

export function PageHero({ eyebrow, title, lead, breadcrumb }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-16 md:pb-20 md:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dots-fade opacity-45" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-32 size-[560px] rounded-full bg-glow-mint opacity-50 blur-3xl animate-float-slow"
      />

      <div className="page-shell relative">
        <div className="mx-auto max-w-3xl text-center">
          {breadcrumb && (
            <motion.nav
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              aria-label="Breadcrumb"
              className="mb-6 flex items-center justify-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted"
            >
              <Link to="/" className="transition-colors hover:text-brand-3">Home</Link>
              <ChevronRight className="size-3" aria-hidden="true" />
              <span className="text-brand-3">{breadcrumb}</span>
            </motion.nav>
          )}

          {eyebrow && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="eyebrow mb-4"
            >
              {eyebrow}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
            className="text-ink"
          >
            {title}
          </motion.h1>

          {lead && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.22, ease: EASE }}
              className="mx-auto mt-6 max-w-2xl text-[1.02rem] leading-[1.7] text-ink-2"
            >
              {lead}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
}

/* Reusable "numbered section" wrapper used across content pages */
export function SectionBlock({ number, eyebrow, title, children, id, className = '' }) {
  return (
    <section id={id} className={`relative section-y-sm ${className}`}>
      <div className="page-shell">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
            <div>
              {number && (
                <span className="mb-4 inline-block font-mono text-[0.7rem] font-semibold tracking-[0.18em] text-brand">
                  {number}
                </span>
              )}
              {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
              <h2 className="text-ink">{title}</h2>
            </div>
            <div className="prose-synthguard max-w-none">{children}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}