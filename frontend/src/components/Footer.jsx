// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const GROUPS = [
  { title: 'Product', links: [
    { to: '/how-it-works', label: 'How it works' },
    { to: '/sample-report', label: 'Sample report' },
    { to: '/use-cases', label: 'Use cases' },
    { to: '/app', label: 'Data workspace' },
  ]},
  { title: 'Workspace', links: [
    { to: '/history', label: 'History' },
    { to: '/compare', label: 'Compare runs' },
    { to: '/roadmap', label: 'Roadmap' },
  ]},
  { title: 'Developers', links: [
    { to: '/api-docs', label: 'API reference' },
    { to: '/privacy', label: 'Privacy notes' },
  ]},
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line/80 bg-white/50">
      <div className="page-shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 shadow-soft">
                <Sparkles className="size-4 text-brand" aria-hidden="true" />
              </span>
              <span className="font-display text-[1.35rem] leading-none text-ink">SynthGuard</span>
            </Link>
            <p className="mt-4 max-w-xs text-[0.88rem] leading-relaxed text-ink-muted">
              Privacy-preserving ML infrastructure. Differentially private synthetic data — share the signal, not the people.
            </p>
          </div>
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="eyebrow mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-[0.9rem] text-ink-2 transition-colors duration-200 hover:text-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="divider-x my-10" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8rem] text-ink-muted">
            © {new Date().getFullYear()} SynthGuard. Demonstrator build — not a certified compliance tool.
          </p>
          <p className="font-mono text-[0.75rem] text-ink-faint">
            epsilon bounds influence, not identity.
          </p>
        </div>
      </div>
    </footer>
  );
}