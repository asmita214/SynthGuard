// src/pages/HowItWorks.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanSearch, Boxes, ShieldCheck, Sparkles, BadgeCheck,
  ArrowRight, BookOpen,
} from 'lucide-react';
import { PageHero, SectionBlock } from '../components/page/PageHero';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { Button } from '../components/ui/Button';

const GLOSSARY = [
  { term: 'VAE', def: 'Variational Autoencoder — a neural network that encodes rows into a low-dimensional latent representation and decodes them back. Learns the joint distribution of your columns, not just each column separately.' },
  { term: 'Encoder', def: 'The half of a VAE that maps an input row to a probability distribution over the latent space.' },
  { term: 'Decoder', def: 'The other half — samples a point from that latent distribution and reconstructs a full row from it.' },
  { term: 'Latent Space', def: 'The compressed internal representation. Points close together in latent space produce similar rows when decoded.' },
  { term: 'DP-SGD', def: 'Differentially Private Stochastic Gradient Descent — the training algorithm that provides the formal privacy guarantee.' },
  { term: 'Gradient Clipping', def: 'Capping each per-sample gradient to a fixed L2 norm before averaging. Prevents any single record from dominating a training step.' },
  { term: 'Epsilon (ε)', def: 'The privacy budget. A smaller ε means stronger privacy and (usually) weaker fidelity. Chosen by you per run.' },
  { term: 'Delta (δ)', def: 'A small probability that the ε-guarantee is violated. Fixed well below 1/n in this build.' },
  { term: 'KS test', def: 'Kolmogorov–Smirnov test. Compares the empirical distributions of each numeric column between real and synthetic data. Used to compute per-column fidelity.' },
  { term: 'Nearest-neighbor distance', def: 'For each synthetic row, the distance to the closest real row. Averaged across all synthetic rows — larger is generally better for privacy.' },
  { term: 'Utility ratio', def: 'Accuracy of a simple classifier trained on synthetic data and tested on real data, divided by the accuracy of the same classifier trained on real data.' },
  { term: 'Argmax decoding', def: 'How categorical columns are reconstructed from the latent space — the class with the highest predicted probability is chosen.' },
];

const STAGES = [
  {
    number: '01',
    id: 'understand',
    eyebrow: 'Stage one',
    title: 'Understand',
    icon: ScanSearch,
    lead: 'Your CSV is profiled before anything is trained.',
    body: (
      <>
        <p>
          When you upload a file, SynthGuard reads it into memory and inspects every column. Each
          column is classified into one of five types based on its values:
        </p>
        <ul className="mt-4 space-y-2 pl-5">
          <li><strong>Numeric</strong> — continuous values. Gets mean, standard deviation, min, max.</li>
          <li><strong>Categorical</strong> — a small set of distinct values. Gets a frequency table.</li>
          <li><strong>Identifier</strong> — high-cardinality, unique-per-row. Excluded from training.</li>
          <li><strong>Text</strong> — free-form strings. Excluded from training.</li>
          <li><strong>Datetime</strong> — parsed dates and timestamps. Excluded from training.</li>
        </ul>
        <p className="mt-4">
          Separately, a heuristic PII detector flags columns whose names or value patterns
          suggest personally identifiable information — email columns, phone numbers, SSN-style
          fields. Flagged columns and columns typed as <code>identifier</code> are marked for
          exclusion before training. They will appear in the profile you review, but they are
          never passed through the generative model.
        </p>
        <p className="mt-4">
          The output of this stage is the <code>profile</code> object you see on the review step —
          per-column type, missing percentage, unique count, and type-specific statistics.
        </p>
      </>
    ),
  },
  {
    number: '02',
    id: 'encode',
    eyebrow: 'Stage two',
    title: 'Encode',
    icon: Boxes,
    lead: 'The VAE compresses each row into a compact representation.',
    body: (
      <>
        <p>
          A Variational Autoencoder takes the surviving columns (everything except identifier,
          text, datetime and PII columns) and learns to represent each row as a point in a
          low-dimensional <em>latent space</em> — typically a handful of dimensions rather than
          dozens.
        </p>
        <p className="mt-4">
          This is a compression, but not the kind that loses the joint structure. The encoder
          maps a row to a probability distribution over the latent space, and the decoder samples
          a point from that distribution and rebuilds a full row. Because encoder and decoder are
          trained together, the latent space ends up organized by the statistical patterns that
          matter — a synthetic row is a plausible point in that space, not a remix of two real rows.
        </p>
        <p className="mt-4">
          Categorical columns are one-hot encoded before training. Numeric columns are standardized.
          Missing values are imputed at training time based on the column’s observed distribution.
        </p>
      </>
    ),
  },
  {
    number: '03',
    id: 'protect',
    eyebrow: 'Stage three',
    title: 'Protect',
    icon: ShieldCheck,
    lead: 'DP-SGD wraps the training loop with gradient clipping and calibrated noise.',
    body: (
      <>
        <p>
          This is the stage that makes SynthGuard <em>private</em>, not merely <em>generative</em>.
          A generative model trained naively can memorize individual training records — a known
          failure mode of VAEs and GANs alike. DP-SGD removes that path.
        </p>
        <p className="mt-4">
          At every training step, instead of averaging the raw per-sample gradients, the optimizer:
        </p>
        <ol className="mt-4 space-y-2 pl-5">
          <li>
            <strong>Clips</strong> each per-sample gradient to a fixed L2 norm <code>C</code>. No
            single record can produce an outsized update.
          </li>
          <li>
            <strong>Adds calibrated Gaussian noise</strong> with standard deviation{' '}
            <code>σ·C</code> to the sum of clipped gradients. The scale <code>σ</code> is derived
            from the target epsilon and delta.
          </li>
          <li>
            <strong>Averages</strong> the noisy sum over the batch and updates the weights.
          </li>
        </ol>
        <p className="mt-4">
          The privacy guarantee comes from the fact that the presence or absence of any single
          training record changes the trained weights by at most a small, bounded amount — the
          noise drowns out any individual contribution.
        </p>
        <p className="mt-4">
          Epsilon controls how much noise is added. Lower epsilon → more noise → stronger privacy
          and softer fidelity. Higher epsilon → less noise → better fidelity and a weaker
          guarantee. There is no configuration where both are free. The 1–10 range offered in the
          workspace is a practical range; the underlying math is well-defined outside it.
        </p>
      </>
    ),
  },
  {
    number: '04',
    id: 'generate',
    eyebrow: 'Stage four',
    title: 'Generate',
    icon: Sparkles,
    lead: 'Fresh rows are sampled from the latent space and decoded.',
    body: (
      <>
        <p>
          Once training finishes, the trained decoder is the generator. To produce a synthetic row,
          SynthGuard samples a point from the latent space and pushes it through the decoder.
          Because the latent space was organized by DP-SGD training, each sample is a plausible
          new observation — one that could have existed in the original dataset’s distribution, but
          did not.
        </p>
        <p className="mt-4">
          Decoding works column-by-column, with different rules per type:
        </p>
        <ul className="mt-4 space-y-2 pl-5">
          <li>
            <strong>Numeric columns</strong> — decoded directly from the decoder’s output.
          </li>
          <li>
            <strong>Categorical columns</strong> — the decoder outputs a probability distribution
            over the training-set classes, and the class with the highest probability is chosen
            (<em>argmax decoding</em>). This is why the model cannot invent new categories.
          </li>
        </ul>
        <p className="mt-4">
          Excluded columns — identifier, text, datetime, PII — are not decoded. If you asked for a
          target column that was itself excluded, the backend resamples it independently from the
          original distribution rather than jointly with the other columns; the results page
          surfaces this as <code>target_jointly_modeled: false</code>.
        </p>
      </>
    ),
  },
  {
    number: '05',
    id: 'validate',
    eyebrow: 'Stage five',
    title: 'Validate',
    icon: BadgeCheck,
    lead: 'Three measurements turn a synthetic dataset into a report card.',
    body: (
      <>
        <p>
          The synthetic dataset is compared against the real one on three independent dimensions.
          All three are computed by the backend and returned in the job response.
        </p>

        <div className="mt-6 space-y-5 not-prose">
          <MetricBlock
            title="Fidelity"
            weight="40%"
            body="Per-column distribution similarity. Numeric columns use a Kolmogorov–Smirnov style comparison of the two distributions; categorical columns use a normalized distance between frequency tables. The overall fidelity is the aggregate across all synthesized columns."
          />
          <MetricBlock
            title="Utility"
            weight="30%"
            body="A simple classifier is trained on the synthetic rows and tested on the real rows, producing synthetic_accuracy. The same classifier architecture is trained on the real rows and tested on the real rows, producing real_accuracy. Utility ratio is synthetic_accuracy divided by real_accuracy — 1.0 means the synthetic data is as predictive as the real data."
          />
          <MetricBlock
            title="Privacy"
            weight="30%"
            body="Average nearest-neighbor distance between each synthetic row and the closest real row. Reported alongside the epsilon value used during training. The nearest-neighbor distance is a heuristic check, not a formal guarantee — the formal guarantee is epsilon."
          />
        </div>

        <p className="mt-6">
          These three components feed a single weighted composite — the SynthGuard Score, at
          40% / 30% / 30%. Grades are assigned as follows: 85 or above Excellent, 70–84 Good,
          50–69 Fair, below 50 Weak.
        </p>
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <>
      <PageHero
        breadcrumb="How it works"
        eyebrow="The pipeline"
        title={<>From CSV to private dataset, in five stages.</>}
        lead="Every stage below is a real step the backend performs. Nothing extra is added for marketing — this is the pipeline as it runs."
      />

      {/* Stage navigation */}
      <section className="border-y border-line/60 bg-white/50">
        <div className="page-shell py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
            {STAGES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-lg px-3 py-1.5 text-[0.82rem] font-medium text-ink-2 transition-colors duration-200 hover:bg-brand-mist hover:text-brand-3"
              >
                {s.number} · {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {STAGES.map((stage, i) => (
        <StageSection key={stage.id} stage={stage} index={i} />
      ))}

      {/* Glossary */}
      <section className="relative section-y border-t border-line/60 bg-canvas-2/40">
        <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-35" aria-hidden="true" />
        <div className="page-shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="eyebrow mb-4">Glossary</p>
              <h2 className="text-ink">Every term, defined.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-[1.7] text-ink-2">
                If a term appears anywhere in SynthGuard — in the UI, the API, or a report —
                it’s listed here.
              </p>
            </Reveal>
          </div>

          <Stagger className="mt-14 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {GLOSSARY.map(({ term, def }) => (
              <StaggerItem key={term}>
                <div className="card h-full p-5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-3.5 text-brand" aria-hidden="true" />
                    <p className="font-mono text-[0.82rem] font-semibold text-brand-3">{term}</p>
                  </div>
                  <p className="mt-2.5 text-[0.84rem] leading-[1.65] text-ink-2">{def}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="section-y">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-10 text-center shadow-card-lg">
              <h2 className="text-ink" style={{ fontSize: '1.75rem' }}>See the pipeline in action.</h2>
              <p className="mx-auto mt-3 max-w-lg text-[0.98rem] leading-[1.7] text-ink-2">
                The sample report shows a completed run end-to-end with fictional data. The
                workspace lets you run the real pipeline on your own CSV.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button to="/app" size="lg">
                  Launch Data Workspace
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <Button to="/sample-report" size="lg" variant="secondary">
                  View sample report
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function StageSection({ stage, index }) {
  const { number, id, eyebrow, title, icon: Icon, lead, body } = stage;
  const alt = index % 2 === 1;

  return (
    <section
      id={id}
      className={`relative section-y-sm scroll-mt-24 ${alt ? 'border-y border-line/60 bg-canvas-2/40' : ''}`}
    >
      {alt && <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-30" aria-hidden="true" />}
      <div className="page-shell relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <Reveal direction="right">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-[0.7rem] font-semibold tracking-[0.18em] text-brand">
                  {number}
                </span>
              </div>
              <p className="eyebrow mt-6">{eyebrow}</p>
              <h2 className="mt-3 text-ink">{title}</h2>
              <p className="mt-4 text-[0.96rem] leading-[1.7] text-ink-2">{lead}</p>
            </div>
          </Reveal>

          <Reveal direction="left" delay={0.05}>
            <div className="prose-synthguard max-w-none">{body}</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MetricBlock({ title, weight, body }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-[1rem] font-semibold text-ink">{title}</h4>
        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[0.66rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
          {weight} of score
        </span>
      </div>
      <p className="mt-3 text-[0.88rem] leading-[1.7] text-ink-2">{body}</p>
    </div>
  );
}