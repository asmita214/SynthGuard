// src/components/landing/MarqueeStrip.jsx
const TERMS = [
  'Differential Privacy',
  'Variational Autoencoder',
  'DP-SGD',
  'Kolmogorov–Smirnov',
  'Latent Space',
  'Gradient Clipping',
  'Nearest-Neighbor Distance',
  'Utility Ratio',
  'Argmax Decoding',
  'Epsilon Budget',
  'Zero Raw Records',
  'Categorical Reconstruction',
];

export function MarqueeStrip() {
  const items = [...TERMS, ...TERMS];

  return (
    <section className="relative overflow-hidden border-y border-line/70 bg-white/60 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-canvas to-transparent" />

      <div className="flex w-max animate-marquee items-center">
        {items.map((term, i) => (
          <span key={`${term}-${i}`} className="flex shrink-0 items-center">
            <span className="px-8 font-mono text-[0.72rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
              {term}
            </span>
            <span className="size-1 rounded-full bg-brand/50" aria-hidden="true" />
          </span>
        ))}
      </div>
    </section>
  );
}