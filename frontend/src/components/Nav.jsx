// src/components/Nav.jsx
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { StatusPill } from './ui/StatusPill';
import { cn } from '../lib/cn';

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/sample-report', label: 'Sample report' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/api-docs', label: 'API' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/roadmap', label: 'Roadmap' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-line/80 backdrop-blur-xl bg-canvas/75 shadow-soft'
            : 'border-b border-transparent',
        )}
      >
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="SynthGuard home">
            <span className="relative flex size-8 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 shadow-soft">
              <Sparkles className="size-4 text-brand transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
            </span>
            <span className="font-display text-[1.35rem] leading-none tracking-[-0.01em] text-ink">
              SynthGuard
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'relative px-3 py-2 text-[0.86rem] font-medium rounded-lg transition-colors duration-200',
                    isActive ? 'text-brand' : 'text-ink-2 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-brand" aria-hidden="true" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <StatusPill className="hidden sm:inline-flex" />
            <Button to="/app" size="sm" className="hidden sm:inline-flex">
              Launch Data Workspace
            </Button>
            <button
              type="button"
              className="lg:hidden flex size-10 items-center justify-center rounded-xl border border-line bg-white text-ink shadow-soft"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div
          className={cn(
            'absolute inset-x-0 top-16 px-5 pb-8 pt-6',
            'bg-canvas border-b border-line shadow-card-lg',
            'transition-transform duration-300',
            open ? 'translate-y-0' : '-translate-y-4',
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <StatusPill />
          </div>
          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn('border-b border-line/70 py-3.5 text-[0.98rem]', isActive ? 'text-brand' : 'text-ink-2')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <Button to="/app" fullWidth size="lg" className="mt-6">Launch Data Workspace</Button>
        </div>
      </div>
    </>
  );
}