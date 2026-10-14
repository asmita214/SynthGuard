// src/pages/Stub.jsx
import { Construction } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function Stub({ title, blurb }) {
  return (
    <section className="page-shell section-y">
      <div className="mb-8">
        <p className="eyebrow mb-3">In progress</p>
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        {blurb && <p className="mt-3 max-w-xl text-ink-2">{blurb}</p>}
      </div>
      <EmptyState
        icon={Construction}
        title="This page is being built"
        description="The route is wired. Content lands in the next step of the build."
        action={<Button to="/" variant="secondary" size="sm">Back to landing</Button>}
      />
    </section>
  );
}