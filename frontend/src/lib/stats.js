// src/lib/stats.js
//
// Client-side statistics for the real-vs-synthetic comparison charts.
//
// Everything here is a pure function over plain row objects ({col: value}).
// The results page calls these with (realRows from memory, syntheticRows from
// GET /download/{job_id}) and pipes the output straight into Recharts.
//
// No network access. No side effects. Safe to run in a Web Worker later.

/* ------------------------------------------------------------------ */
/* Numeric helpers                                                     */
/* ------------------------------------------------------------------ */

/** Coerce a value to a finite number, or null. */
function asNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** All finite numeric values of `column` across `rows`. */
export function numericValues(rows, column) {
  if (!Array.isArray(rows) || !column) return [];
  const out = [];
  for (const row of rows) {
    const n = asNumber(row?.[column]);
    if (n !== null) out.push(n);
  }
  return out;
}

export function mean(values) {
  if (!values.length) return null;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function stdDev(values) {
  const n = values.length;
  if (n < 2) return null;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) ** 2;
  return Math.sqrt(acc / (n - 1));
}

/**
 * Which of `candidates` actually contain usable numbers in `rows`.
 * Inspects a sample so we don't scan 100k rows to answer the question.
 */
export function pickNumericColumns(rows, candidates, sampleSize = 200) {
  if (!Array.isArray(rows) || !rows.length || !Array.isArray(candidates)) return [];
  const sample = rows.slice(0, Math.min(sampleSize, rows.length));
  return candidates.filter((col) =>
    sample.some((row) => asNumber(row?.[col]) !== null),
  );
}

/* ------------------------------------------------------------------ */
/* Histograms                                                          */
/* ------------------------------------------------------------------ */

function formatBinEdge(value, step) {
  if (!Number.isFinite(value)) return '—';
  const dp = step < 0.1 ? 3 : step < 1 ? 2 : step < 10 ? 1 : 0;
  return value.toFixed(dp);
}

/**
 * @typedef {Object} HistogramBin
 * @property {number} x0      left edge
 * @property {number} x1      right edge
 * @property {string} label   short axis label
 * @property {number} real    count in the real dataset
 * @property {number} synth   count in the synthetic dataset
 */

/**
 * Bins both distributions over the SAME x-range so they overlay on one chart.
 *
 * @param {number[]} realValues
 * @param {number[]} synthValues
 * @param {number}  [binCount=20]
 * @returns {{min:number, max:number, step:number, bins:HistogramBin[], maxCount:number}}
 */
export function buildHistogram(realValues, synthValues, binCount = 20) {
  const real = Array.isArray(realValues) ? realValues.filter(Number.isFinite) : [];
  const synth = Array.isArray(synthValues) ? synthValues.filter(Number.isFinite) : [];
  const all = [...real, ...synth];

  if (!all.length) {
    return { min: 0, max: 0, step: 0, bins: [], maxCount: 0 };
  }

  let min = Math.min(...all);
  let max = Math.max(...all);

  // Handle a column where every value is identical.
  if (min === max) {
    min -= 0.5;
    max += 0.5;
  }

  const step = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const x0 = min + i * step;
    const x1 = x0 + step;
    return {
      x0,
      x1,
      label: `${formatBinEdge(x0, step)}–${formatBinEdge(x1, step)}`,
      real: 0,
      synth: 0,
    };
  });

  const place = (value, key) => {
    let idx = Math.floor((value - min) / step);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx][key] += 1;
  };

  for (const v of real) place(v, 'real');
  for (const v of synth) place(v, 'synth');

  const maxCount = Math.max(1, ...bins.map((b) => Math.max(b.real, b.synth)));

  return { min, max, step, bins, maxCount };
}

/* ------------------------------------------------------------------ */
/* Categorical frequencies                                             */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} CategoryFrequency
 * @property {string} key
 * @property {number} real        raw count in real rows
 * @property {number} synth       raw count in synthetic rows
 * @property {number} realPct
 * @property {number} synthPct
 */

/**
 * Frequency breakdown of a categorical column across both datasets.
 * Union of keys, sorted by combined count, capped at `topN`.
 *
 * @param {object[]} realRows
 * @param {object[]} synthRows
 * @param {string}   column
 * @param {number}   [topN=12]
 * @returns {CategoryFrequency[]}
 */
export function buildCategoryFrequency(realRows, synthRows, column, topN = 12) {
  const tally = (rows) => {
    const m = new Map();
    if (!Array.isArray(rows)) return m;
    for (const row of rows) {
      const raw = row?.[column];
      const key = raw == null || raw === '' ? '(missing)' : String(raw);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  };

  const realMap = tally(realRows);
  const synthMap = tally(synthRows);

  const keys = new Set([...realMap.keys(), ...synthMap.keys()]);
  const combined = [...keys].map((key) => {
    const real = realMap.get(key) ?? 0;
    const synth = synthMap.get(key) ?? 0;
    return { key, real, synth, total: real + synth };
  });

  combined.sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));

  const realTotal = realRows?.length || 1;
  const synthTotal = synthRows?.length || 1;

  return combined.slice(0, topN).map((c) => ({
    key: c.key,
    real: c.real,
    synth: c.synth,
    realPct: (c.real / realTotal) * 100,
    synthPct: (c.synth / synthTotal) * 100,
  }));
}

/** Every key that exists in one dataset but not the other. */
export function findCategoryMismatches(realRows, synthRows, column) {
  const realKeys = new Set();
  const synthKeys = new Set();

  for (const row of realRows ?? []) {
    const raw = row?.[column];
    realKeys.add(raw == null || raw === '' ? '(missing)' : String(raw));
  }
  for (const row of synthRows ?? []) {
    const raw = row?.[column];
    synthKeys.add(raw == null || raw === '' ? '(missing)' : String(raw));
  }

  const onlyReal = [...realKeys].filter((k) => !synthKeys.has(k));
  const onlySynth = [...synthKeys].filter((k) => !realKeys.has(k));

  return { onlyReal, onlySynth };
}

/* ------------------------------------------------------------------ */
/* Correlations                                                        */
/* ------------------------------------------------------------------ */

/**
 * Pearson correlation between two equal-or-ragged numeric series.
 * Pairs values by index, skipping any index where either side is missing.
 */
export function pearson(xs, ys) {
  const n = Math.min(xs?.length ?? 0, ys?.length ?? 0);
  if (n < 2) return null;

  const xs2 = [];
  const ys2 = [];
  for (let i = 0; i < n; i += 1) {
    const x = asNumber(xs[i]);
    const y = asNumber(ys[i]);
    if (x === null || y === null) continue;
    xs2.push(x);
    ys2.push(y);
  }
  const m = xs2.length;
  if (m < 2) return null;

  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < m; i += 1) {
    const x = xs2[i];
    const y = ys2[i];
    sx += x; sy += y;
    sxx += x * x; syy += y * y; sxy += x * y;
  }

  const numerator = m * sxy - sx * sy;
  const denominator = Math.sqrt((m * sxx - sx * sx) * (m * syy - sy * sy));
  if (denominator === 0) return null;

  return numerator / denominator;
}

/**
 * Full correlation matrix over the given numeric columns.
 * @returns {Object<string, Object<string, number|null>>}
 */
export function buildCorrelationMatrix(rows, columns) {
  const matrix = {};
  if (!Array.isArray(rows) || !rows.length || !Array.isArray(columns)) return matrix;

  // Pre-extract value vectors so we don't walk `rows` O(n²) times.
  const vectors = {};
  for (const col of columns) vectors[col] = numericValues(rows, col);

  for (const a of columns) {
    matrix[a] = {};
    for (const b of columns) {
      if (a === b) {
        matrix[a][b] = 1;
      } else if (b < a && matrix[b]?.[a] !== undefined) {
        // symmetric — reuse
        matrix[a][b] = matrix[b][a];
      } else {
        matrix[a][b] = pearson(vectors[a], vectors[b]);
      }
    }
  }

  return matrix;
}

/**
 * Element-wise absolute difference between two matrices.
 * Used to render "correlation drift" between real and synthetic data.
 */
export function subtractMatrix(a, b) {
  const out = {};
  for (const rowKey of Object.keys(a ?? {})) {
    out[rowKey] = {};
    for (const colKey of Object.keys(a[rowKey] ?? {})) {
      const va = a[rowKey][colKey];
      const vb = b?.[rowKey]?.[colKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        out[rowKey][colKey] = Math.abs(va - vb);
      } else {
        out[rowKey][colKey] = null;
      }
    }
  }
  return out;
}

/**
 * Flatten a matrix into a heatmap-friendly cell list.
 * @returns {{row:string, col:string, value:number|null}[]}
 */
export function matrixToCells(matrix, columns) {
  const cells = [];
  for (const row of columns) {
    for (const col of columns) {
      const value = matrix?.[row]?.[col];
      cells.push({
        row,
        col,
        value: typeof value === 'number' && Number.isFinite(value) ? value : null,
      });
    }
  }
  return cells;
}

/* ------------------------------------------------------------------ */
/* Small quality-of-life helpers                                       */
/* ------------------------------------------------------------------ */

/**
 * Mean absolute drift across a numeric column, in the original units.
 * Useful as a "how far did the distribution shift" one-liner.
 */
export function meanAbsoluteDrift(realValues, synthValues) {
  if (!realValues?.length || !synthValues?.length) return null;
  const mr = mean(realValues);
  const ms = mean(synthValues);
  return Math.abs(mr - ms);
}

/**
 * Safe 0–100 normaliser for bar widths and progress rings.
 */
export function clampPercent(value, { min = 0, max = 100 } = {}) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(min, Math.min(max, value));
}