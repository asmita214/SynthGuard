// src/components/landing/TechnicalDepth.jsx
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';

const TERMS = [
  { term: 'VAE',                        def: 'Variational Autoencoder — a network that compresses rows into a latent representation and reconstructs them, learning the joint distribution of your columns.' },
  { term: 'Latent space',               def: 'The compressed internal representation. Synthetic rows are sampled here, then decoded back into full rows.' },
  { term: 'DP-SGD',                     def: 'Differentially Private Stochastic Gradient Descent — training where per-record gradients are clipped and noise is added at each step.' },
  { term: 'Gradient clipping',          def: 'Capping the magnitude of each sample’s gradient so no single record can dominate a training step.' },
  { term: 'Calibrated noise',           def: 'Gaussian noise whose scale is derived from the clipping norm and the target epsilon.' },
  { term: 'Epsilon (ε)',                def: 'The privacy budget. Smaller ε = stronger privacy, softer fidelity.' },
  { term: 'Delta (δ)',                  def: 'A small probability of the ε guarantee being violated — set far below 1/n.' },
  { term: 'KS test',                    def: 'Kolmogorov–Smirnov test. Compares the distribution of each numeric column between real and synthetic data.' },
  { term: 'Nearest-neighbor distance',  def: 'Average distance from each synthetic row to the closest real row. Larger is generally better for privacy.' },
  { term: 'Utility ratio',              def: 'Synthetic accuracy divided by real accuracy for a simple classifier — how much predictive power survives into the synthetic dataset.' },
  { term: 'Argmax decoding',            def: 'How categorical columns are rebuilt from the latent space — the class with the highest predicted probability wins.' },
  { term: 'SynthGuard Score',           def: 'Weighted composite of fidelity (40%), utility (30%) and privacy (30%), computed by the backend after every run.' },
];

export function TechnicalDepth() {
  return (
    <section className="relative section-y">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">For the technically minded</p>
            <h2 className="text-ink">Every term, defined.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
              No jargon without a definition. If a term appears anywhere in SynthGuard, it’s
              listed here.
            </p>
          </Reveal>
        </div>

        <Stagger
          className="mt-14 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.05}
        >
          {TERMS.map(({ term, def }) => (
            <StaggerItem key={term}>
              <div className="card h-full p-5">
                <p className="font-mono text-[0.82rem] font-semibold text-brand-3">{term}</p>
                <p className="mt-2 text-[0.84rem] leading-[1.65] text-ink-2">{def}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}