// src/pages/Landing.jsx
import {
  Hero, MarqueeStrip, Problem, Solution, Pipeline, Dimensions,
  Comparison, UseCases, TechnicalDepth, FAQ, FinalCTA,
} from '../components/landing';

export function Landing() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <Problem />
      <Solution />
      <Pipeline />
      <Dimensions />
      <Comparison />
      <UseCases />
      <TechnicalDepth />
      <FAQ />
      <FinalCTA />
    </>
  );
}