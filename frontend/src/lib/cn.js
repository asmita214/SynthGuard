// src/lib/cn.js
//
// One tiny helper used by every component:
//   cn('p-4', isActive && 'bg-brand', props.className)
//
// clsx handles the conditional logic, tailwind-merge resolves conflicting
// utilities so later classes win (bg-red-500 bg-brand → bg-brand).

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}