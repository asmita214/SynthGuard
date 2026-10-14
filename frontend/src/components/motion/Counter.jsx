// src/components/motion/Counter.jsx
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export function Counter({
  to,
  from = 0,
  duration = 1.6,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : from);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setValue(to); return; }

    let raf;
    let startTimer;

    const start = () => {
      const t0 = performance.now();
      const delta = to - from;

      const tick = (now) => {
        const t = Math.min((now - t0) / (duration * 1000), 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(from + delta * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    startTimer = setTimeout(start, delay * 1000);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [inView, to, from, duration, delay, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}