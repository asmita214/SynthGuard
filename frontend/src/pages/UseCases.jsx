// src/pages/UseCases.jsx
import { Link } from 'react-router-dom';
import {
  HeartPulse, Landmark, Users, ShoppingBag,
  ArrowRight, Check, AlertTriangle, Sparkles,
} from 'lucide-react';
import { PageHero } from '../components/page/PageHero';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';


const CASES = [
  /* ---------------- 01 — HEALTHCARE ---------------- */
  {
    id: 'healthcare',
    icon: HeartPulse,
    number: '01',
    name: 'Healthcare',
    short: 'Research collaboration without exposing patients.',
    hero: 'Enable cohort studies and method development across institutions — without a single identifiable patient record ever crossing an organisational boundary.',
    scenario: [
      'A hospital’s clinical data science team is collaborating with an external research group on a sepsis early-warning model. The research group needs realistic patient-pattern data to develop and tune their pipeline, but the hospital cannot share identifiable records. Standard de-identification (stripping names and IDs) is not sufficient — the combination of age, admission date, diagnosis codes and location is often uniquely identifying on its own.',
      'Historically, this meant one of two paths: months of legal review for a limited, heavily-redacted extract — or no collaboration at all. Both slow the research and neither removes the underlying risk.',
    ],
    approach: [
      {
        title: 'Profile the cohort',
        body: 'The hospital uploads a CSV of vitals, lab values, diagnosis codes and admission metadata. SynthGuard’s profiling step types each column — continuous vitals, categorical diagnoses, identifier-like MRNs — and flags PII columns for exclusion.',
      },
      {
        title: 'Train under a chosen epsilon',
        body: 'The clinical team chooses epsilon before training begins. For a research collaboration, ε = 3 is a common starting point — enough fidelity for the researchers to iterate on their pipeline, with a strong single-record guarantee.',
      },
      {
        title: 'Share the synthetic extract',
        body: 'The research group receives a synthetic dataset with the same statistical structure. It contains no real patients. The hospital retains the raw records; nothing identifiable leaves its systems.',
      },
    ],
    benefits: [
      'Research moves forward without a months-long legal review per extract.',
      'The privacy guarantee is a number (ε), not a policy document.',
      'Every synthetic row is scored on fidelity, utility and privacy so the clinical team knows what was preserved.',
    ],
    caveat: 'This is not a substitute for IRB review. Regulators, ethics boards and institutional data governance still apply — SynthGuard shortens the negotiation, it does not remove the requirement.',
  },

  /* ---------------- 02 — FINANCE ---------------- */
  {
    id: 'finance',
    icon: Landmark,
    number: '02',
    name: 'Finance',
    short: 'Fraud model development without circulating real ledgers.',
    hero: 'Give fraud-detection teams a working dataset with the same transaction patterns as production — without shipping customer ledgers to a vendor or a test environment.',
    scenario: [
      'A bank’s fraud team is building a new detection model. The best training data is production traffic — but production traffic is a compliance liability the moment it leaves the bank’s boundary. Sending a copy of the ledger to a third-party vendor for pipeline development, or even loading it into a less-regulated test environment, is a decision that gets escalated fast.',
      'The fraud team needs volume, variety and realistic correlations: transaction amounts that scale with merchant category, timing patterns, merchant-level distributions, and labeled fraud signal that actually survives into the synthetic data.',
    ],
    approach: [
      {
        title: 'Profile transactions and labels',
        body: 'The bank uploads a CSV with amounts, merchant category, time-of-day, and a fraud label column. SynthGuard types the columns, detects identifier-like account numbers, and flags any customer-name columns for exclusion.',
      },
      {
        title: 'Train with the fraud label as target',
        body: 'The fraud label is a categorical column with two values, so it qualifies as a target under SynthGuard’s rules. The utility check trains a classifier on the synthetic rows and tests it on real rows — a direct measurement of whether the synthetic data preserves the fraud signal.',
      },
      {
        title: 'Hand the synthetic dataset to the vendor',
        body: 'Vendors and test environments receive a dataset with the same statistical structure, no real customer accounts, and a utility ratio the bank can inspect before signing off on the transfer.',
      },
    ],
    benefits: [
      'Vendor and test environments receive a real working dataset, not a placeholder.',
      'The utility ratio directly measures whether the fraud signal survived synthesis.',
      'Dropped columns (account numbers, customer IDs) never appear in the synthetic output.',
    ],
    caveat: 'Fraud patterns drift. A synthetic dataset captured on Monday will produce a model that reflects Monday’s pattern, not Wednesday’s. Regenerate on a cadence that matches your threat model.',
  },

  /* ---------------- 03 — HR & PEOPLE ANALYTICS ---------------- */
  {
    id: 'hr',
    icon: Users,
    number: '03',
    name: 'HR & People Analytics',
    short: 'Workforce analytics without exposing individual employees.',
    hero: 'Let every team run analytics on headcount, compensation, attrition and DEI — without any query being traceable to a named employee.',
    scenario: [
      'People analytics teams are asked to answer questions that touch every employee: attrition drivers, compensation equity by level and geography, hiring funnel conversion, DEI trends. The data underlying these answers is among the most sensitive an organisation holds — compensation, performance ratings, protected characteristics, disciplinary history.',
      'Analysts need to iterate. They need to run dozens of queries, join tables, test hypotheses. Every one of those queries against real employee data is a small risk. The compliance team cannot approve an unbounded query surface against HR records.',
    ],
    approach: [
      {
        title: 'Profile the workforce extract',
        body: 'HR uploads a CSV with role, level, compensation, tenure, location, and any DEI dimension columns they want preserved. SynthGuard flags identifiers (employee IDs) and PII (names, emails) for exclusion.',
      },
      {
        title: 'Choose epsilon carefully',
        body: 'HR datasets are often smaller than clinical or financial ones — a few thousand rows at most. Smaller datasets mean lower fidelity for a given epsilon, so a higher ε (6–8) is often needed to keep compensation bands and attrition rates meaningful.',
      },
      {
        title: 'Give analysts the synthetic extract',
        body: 'Analysts run whatever queries they want against synthetic data. Distributions match the real workforce; no row corresponds to a real person. When a metric needs to be reported externally, it can be validated against the real data by the HR team.',
      },
    ],
    benefits: [
      'Unbounded analytics — analysts query without triggering a compliance review.',
      'Compensation and DEI distributions survive synthesis when ε is set appropriately.',
      'No query against the synthetic extract can leak an individual’s compensation or rating.',
    ],
    caveat: 'Small sub-populations are hard. If a level has 12 employees, the model has very little to learn from — synthetic rows for that sub-group will be closer to the population average than the real data. Treat sub-group metrics with care.',
  },

  /* ---------------- 04 — RETAIL ---------------- */
  {
    id: 'retail',
    icon: ShoppingBag,
    number: '04',
    name: 'Retail & E-commerce',
    short: 'Recommendation and pricing models without leaking purchase history.',
    hero: 'Hand recommendation and pricing teams a working dataset with the same behavioural structure as live traffic — without exposing any customer’s purchase history.',
    scenario: [
      'A retailer’s recommendation team needs data for model development: what customers browse, what they buy, in what combinations, at what frequency. The best data for this is the production purchase history — but purchase history is per-customer, and customer purchase history is close to a fingerprint in its own right.',
      'Historically, teams work with a small, hand-picked sample of heavy users, or they work with aggregated summaries that lose the co-purchase structure recommendations depend on.',
    ],
    approach: [
      {
        title: 'Profile the purchase extract',
        body: 'The retailer uploads a CSV with product IDs, categories, prices, quantities and basket IDs. SynthGuard flags customer IDs for exclusion, types product IDs as identifier-like if they are high-cardinality, and preserves the categorical structure of product categories.',
      },
      {
        title: 'Preserve joint structure',
        body: 'Recommendation systems live or die on correlations between products. SynthGuard’s VAE learns the joint distribution of the columns — not just each column individually — so patterns like "customers who bought X also bought Y" are preserved in the synthetic output. The correlation matrix comparison on the results page makes this visible.',
      },
      {
        title: 'Iterate on synthetic data',
        body: 'The recommendation team iterates on the synthetic dataset. When a promising model is found, it is retrained on production data by the retailer’s own team. Vendor and contractor access stays confined to the synthetic data.',
      },
    ],
    benefits: [
      'Recommendation teams work with realistic basket-level structure, not truncated samples.',
      'Product categories stay balanced — argmax decoding prevents the model from inventing categories.',
      'Customer purchase histories never leave the retailer’s systems.',
    ],
    caveat: 'Long-tail products are underrepresented by design. If a product has very few purchases, the model cannot meaningfully learn its co-purchase pattern. Aggregate rare products into broader categories before profiling if their individual signal matters.',
  },
];

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */

export function UseCases() {
  return (
    <>
      <PageHero
        breadcrumb="Use cases"
        eyebrow="Applied patterns"
        title="One data-generation layer, applied across industries."
        lead="SynthGuard is horizontal infrastructure — not a vertical product. Below are four patterns we see across the teams that need it, written as real scenarios with real caveats."
      />

      {/* Jump nav */}
      <section className="border-y border-line/60 bg-white/50">
        <div className="page-shell py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
            {CASES.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.82rem] font-medium text-ink-2 transition-colors duration-200 hover:bg-brand-mist hover:text-brand-3"
              >
                <c.icon className="size-3.5" aria-hidden="true" />
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Case sections */}
      {CASES.map((c, i) => (
        <CaseSection key={c.id} caseData={c} index={i} />
      ))}

      {/* CTA */}
      <section className="section-y">
        <div className="page-shell">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-10 text-center shadow-card-lg">
              <h2 className="text-ink" style={{ fontSize: '1.75rem' }}>
                Which pattern fits your data?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[0.98rem] leading-[1.7] text-ink-2">
                If your team handles sensitive records and cannot share them freely, the answer
                is probably yes. Bring a CSV to the workspace and see what your own report looks
                like.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button to="/app" size="lg">
                  Launch Data Workspace
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <Button to="/sample-report" size="lg" variant="secondary">
                  See a sample report
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ================================================================== */
/* Case section                                                        */
/* ================================================================== */

function CaseSection({ caseData, index }) {
  const { id, icon: Icon, number, name, short, hero, scenario, approach, benefits, caveat } = caseData;
  const alt = index % 2 === 1;

  return (
    <section
      id={id}
      className={`relative section-y scroll-mt-24 ${alt ? 'border-y border-line/60 bg-canvas-2/40' : ''}`}
    >
      {alt && <div className="pointer-events-none absolute inset-0 bg-dots-fade opacity-30" aria-hidden="true" />}

      <div className="page-shell relative">
        {/* Header */}
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand-3 shadow-soft">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-[0.72rem] font-semibold tracking-[0.18em] text-brand">
                {number}
              </span>
            </div>

            <p className="eyebrow mt-6">{name}</p>
            <h2 className="mt-3 text-ink" style={{ fontSize: 'clamp(1.75rem, 2.2vw + 0.5rem, 2.5rem)' }}>
              {short}
            </h2>
            <p className="mt-5 max-w-2xl text-[1rem] leading-[1.7] text-ink-2">{hero}</p>
          </div>
        </Reveal>

        {/* Scenario */}
        <Reveal delay={0.06}>
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="eyebrow mb-4">The scenario</p>
            <div className="prose-synthguard">
              {scenario.map((para, i) => (
                <p key={i} className={i > 0 ? 'mt-4' : ''}>{para}</p>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Approach */}
        <div className="mx-auto mt-16 max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-4">How SynthGuard fits</p>
            <h3 className="text-ink" style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Three steps, same pipeline as every other run.
            </h3>
          </Reveal>

          <Stagger className="mt-8 space-y-4" stagger={0.09}>
            {approach.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="card relative overflow-hidden p-6">
                  <div className="flex items-start gap-5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-mist font-mono text-[0.8rem] font-semibold text-brand-3">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="text-[1rem] font-semibold text-ink">{step.title}</h4>
                      <p className="mt-2 text-[0.9rem] leading-[1.7] text-ink-2">{step.body}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* Benefits + caveat */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-5 md:grid-cols-2">
          <Reveal>
            <div className="card h-full p-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 text-brand" aria-hidden="true" />
                <p className="font-semibold text-ink">What teams get</p>
              </div>
              <ul className="mt-4 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <Check className="mt-1 size-3.5 shrink-0 text-brand-3" aria-hidden="true" />
                    <span className="text-[0.88rem] leading-[1.65] text-ink-2">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="flex h-full flex-col rounded-2xl border border-warn/25 bg-warn-soft/50 p-6">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-warn" aria-hidden="true" />
                <p className="font-semibold text-ink">What to watch for</p>
              </div>
              <p className="mt-4 text-[0.88rem] leading-[1.7] text-ink-2">{caveat}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}