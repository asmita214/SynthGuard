

import Papa from 'papaparse';

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

export const MAX_FILE_BYTES = 100 * 1024 * 1024;  // hard block
export const WARN_FILE_BYTES = 25 * 1024 * 1024;  // soft warning
export const ALLOWED_EXTENSIONS = ['.csv'];
export const DEFAULT_MAX_ROWS = 5000;
export const DEFAULT_SAMPLE_ROWS = 3000;

/* ------------------------------------------------------------------ */
/* Errors + formatting                                                 */
/* ------------------------------------------------------------------ */

export class CsvError extends Error {
  constructor(message, { code = 'csv-error', cause = null } = {}) {
    super(message);
    this.name = 'CsvError';
    this.code = code;
    this.cause = cause;
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} FileValidation
 * @property {boolean} ok
 * @property {'ok'|'warn'|'error'} level
 * @property {'no-file'|'type'|'empty'|'too-large'|'size'|null} reason
 * @property {string|null} message
 */

/**
 * @param {File|null|undefined} file
 * @returns {FileValidation}
 */
export function validateCsvFile(file) {
  if (!file) {
    return { ok: false, level: 'error', reason: 'no-file', message: 'Choose a CSV file to continue.' };
  }

  const name = String(file.name || '').toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const mime = String(file.type || '').toLowerCase();
  const mimeOk =
    mime === '' ||
    mime === 'text/csv' ||
    mime === 'text/plain' ||
    mime === 'application/csv' ||
    mime === 'application/vnd.ms-excel';

  if (!extOk && !mimeOk) {
    return {
      ok: false,
      level: 'error',
      reason: 'type',
      message: `"${file.name}" isn't a CSV file. SynthGuard only accepts .csv files.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, level: 'error', reason: 'empty', message: 'That file is empty.' };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      level: 'error',
      reason: 'too-large',
      message: `That file is ${formatBytes(file.size)}. The hard limit is 100 MB — please split or sample it before uploading.`,
    };
  }

  if (file.size > WARN_FILE_BYTES) {
    return {
      ok: true,
      level: 'warn',
      reason: 'size',
      message: `That file is ${formatBytes(file.size)}. Files over 25 MB are loaded fully into memory on the server, so training may take a while.`,
    };
  }

  return { ok: true, level: 'ok', reason: null, message: null };
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} ParsedCsv
 * @property {Object<string, any>[]} rows      parsed records (dynamicTyping on)
 * @property {string[]} columns                header order
 * @property {object} meta                     Papa meta (delimiter, linebreak, …)
 * @property {number} rowCount
 */

/**
 * Parse a CSV File in the browser. Runs immediately on file selection, BEFORE upload,
 * so the results page can build real-vs-synthetic charts from memory.
 *
 * @param {File} file
 * @param {{onProgress?: (pct: number) => void, worker?: boolean}} [opts]
 * @returns {Promise<ParsedCsv>}
 */
export function parseCsvFile(file, { onProgress, worker = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new CsvError('No file supplied.', { code: 'no-file' }));
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker,
      complete: (results) => {
        const rows = Array.isArray(results.data) ? results.data : [];
        const columns = Array.isArray(results.meta?.fields) ? results.meta.fields : [];

        if (!columns.length || !rows.length) {
          reject(
            new CsvError(
              'That file has no readable rows. Make sure the first line is a header row.',
              { code: 'empty-parse' },
            ),
          );
          return;
        }

        // Papa reports recoverable issues (ragged rows) in `errors`; only
        // surface them when they'd actually corrupt the data.
        const fatal = (results.errors || []).filter(
          (e) => e.code === 'UndetectableDelimiter' || e.code === 'MissingQuotes',
        );
        if (fatal.length && rows.length === 0) {
          reject(new CsvError('We could not detect the delimiter in that file.', { code: 'delimiter' }));
          return;
        }

        resolve({
          rows,
          columns,
          meta: results.meta ?? {},
          rowCount: rows.length,
        });
      },
      error: (err) => {
        reject(
          new CsvError(err?.message || 'Could not read that CSV file.', {
            code: 'parse-failed',
            cause: err,
          }),
        );
      },
    });

    // Papa's File-mode progress callback isn't part of the public typing but is
    // emitted through `step` in some versions; guard it so a no-op is fine.
    if (typeof onProgress === 'function' && file.size) {
      onProgress(0);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Writing / exporting                                                 */
/* ------------------------------------------------------------------ */

/**
 * Serialise row objects to a CSV string.
 * @param {object[]} rows
 * @param {string[]} [columns] header order; inferred from the first row if omitted
 */
export function rowsToCsv(rows, columns) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  return Papa.unparse(rows, {
    columns: columns && columns.length ? columns : undefined,
    newline: '\n',
  });
}

export function buildCsvBlob(rows, columns) {
  return new Blob([rowsToCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' });
}

export function buildJsonBlob(rows) {
  return new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
}

/** Trigger a browser download for a Blob. Safe to call repeatedly. */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Strip characters that browsers/OSes dislike in filenames. */
export function sanitizeFilename(name, fallback = 'synthguard') {
  const base = String(name ?? '')
    .replace(/\.csv$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || fallback;
}

export function downloadRowsAsCsv(rows, filename, columns) {
  triggerDownload(buildCsvBlob(rows, columns), filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function downloadRowsAsJson(rows, filename) {
  triggerDownload(
    buildJsonBlob(rows),
    filename.endsWith('.json') ? filename : `${filename}.json`,
  );
}

/* ------------------------------------------------------------------ */
/* In-browser sample dataset ("Try with sample data")                  */
/* ------------------------------------------------------------------ */

/** Deterministic PRNG so the sample dataset is identical on every machine. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// category → typical unit price, and how often it shows up
const SAMPLE_CATEGORIES = [
  { label: 'Beverages', basePrice: 4.2, share: 0.24 },
  { label: 'Snacks', basePrice: 2.6, share: 0.2 },
  { label: 'Household', basePrice: 9.4, share: 0.16 },
  { label: 'Personal Care', basePrice: 7.1, share: 0.14 },
  { label: 'Produce', basePrice: 3.1, share: 0.15 },
  { label: 'Dairy', basePrice: 5.3, share: 0.11 },
];

const SAMPLE_STORE_COUNT = 20;
const SAMPLE_CUSTOMER_COUNT = 1400;

function pickCategory(rand) {
  let roll = rand();
  for (const category of SAMPLE_CATEGORIES) {
    roll -= category.share;
    if (roll <= 0) return category;
  }
  return SAMPLE_CATEGORIES[SAMPLE_CATEGORIES.length - 1];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Retail-style sample data: quantity, unit_price, total_price, category,
 * store_id, customer_id. ~3000 rows by default so a visitor can try the whole
 * pipeline with zero setup.
 *
 * customer_id and store_id are intentionally high-cardinality identifiers —
 * they exercise the "identifier columns are excluded from synthesis" path.
 *
 * @param {number} [rowCount]
 * @returns {object[]}
 */
export function buildSampleDataset(rowCount = DEFAULT_SAMPLE_ROWS) {
  const rand = mulberry32(20240517);
  const rows = [];

  for (let i = 0; i < rowCount; i += 1) {
    const category = pickCategory(rand);
    const quantity = 1 + Math.floor(rand() * 8);

    // small per-row price jitter, plus a bulk discount at high quantity
    const jitter = 0.85 + rand() * 0.3;
    let unitPrice = category.basePrice * jitter;
    if (quantity >= 5) unitPrice *= 0.94;
    unitPrice = round2(unitPrice);

    const storeId = `ST-${String(1 + Math.floor(rand() * SAMPLE_STORE_COUNT)).padStart(3, '0')}`;
    const customerId = `CUST-${String(
      1 + Math.floor(rand() * SAMPLE_CUSTOMER_COUNT),
    ).padStart(5, '0')}`;

    rows.push({
      quantity,
      unit_price: unitPrice,
      total_price: round2(unitPrice * quantity),
      category: category.label,
      store_id: storeId,
      customer_id: customerId,
    });
  }

  return rows;
}

export const SAMPLE_COLUMNS = [
  'quantity',
  'unit_price',
  'total_price',
  'category',
  'store_id',
  'customer_id',
];

/**
 * The sample dataset as a File, ready to hand to POST /upload.
 * @param {number} [rowCount]
 * @returns {File}
 */
export function buildSampleCsvFile(rowCount = DEFAULT_SAMPLE_ROWS) {
  const rows = buildSampleDataset(rowCount);
  const csv = rowsToCsv(rows, SAMPLE_COLUMNS);
  return new File([csv], 'synthguard-sample-retail.csv', { type: 'text/csv' });
}