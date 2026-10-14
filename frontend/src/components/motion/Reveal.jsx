// src/components/motion/Reveal.jsx
//
// Scroll-triggered reveal. Fires once when the element enters the viewport.
// Use everywhere instead of hand-rolling whileInView — keeps easing consistent.

import { motion, useReducedMotion } from 'framer-motion';

const DIRECTIONS = {
  up:    { y: 28, x: 0 },
  down:  { y: -28, x: 0 },
  left:  { y: 0, x: 32 },
  right: { y: 0, x: -32 },
  none:  { y: 0, x: 0 },
};

const EASE = [0.16, 1, 0.3, 1];

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.75,
  distance,
  once = true,
  amount = 0.25,
  as: As = motion.div,
  className,
  ...rest
}) {
  const reduce = useReducedMotion();
  const base = DIRECTIONS[direction] ?? DIRECTIONS.up;
  const from = distance ? { x: 0, y: distance * Math.sign(base.y || 1) } : base;

  if (reduce) {
    return <As className={className} {...rest}>{children}</As>;
  }

  return (
    <As
      className={className}
      initial={{ opacity: 0, ...from }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </As>
  );
}