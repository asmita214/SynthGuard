// src/components/motion/Stagger.jsx
//
// Parent/child pair for staggered list reveals.
//
//   <Stagger>
//     <StaggerItem>…</StaggerItem>
//     <StaggerItem>…</StaggerItem>
//   </Stagger>

import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

export function Stagger({
  children,
  stagger = 0.09,
  delay = 0,
  once = true,
  amount = 0.2,
  className,
  as: As = motion.div,
  ...rest
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <As className={className} {...rest}>{children}</As>;
  }

  return (
    <As
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

export function StaggerItem({
  children,
  distance = 24,
  className,
  as: As = motion.div,
  ...rest
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <As className={className} {...rest}>{children}</As>;
  }

  return (
    <As
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </As>
  );
}