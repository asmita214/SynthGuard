const RAW_BASE =
  import.meta.env.VITE_API_URL || 'https://synthguard-backend.onrender.com';

/** Normalised base URL, no trailing slash. */
export const API_BASE = String(RAW_BASE).replace(/\/+$/, '');

/* ------------------------------------------------------------------ */
/* Timeouts & retry policy                                             */
/* ------------------------------------------------------------------ */

export const WAKE_TIMEOUT_MS = 90_000;          // cold-start ping (Render free tier)
export const FIRST_REQUEST_TIMEOUT_MS = 90_000; // first real request after page load
export const DEFAULT_TIMEOUT_MS = 30_000;       // everything after that
export const UPLOAD_TIMEOUT_MS = 120_000;       // file transfers get a little more room

export const MAX_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 600;         // 600ms, then 1200ms (+ jitter)

const RETRYABLE_STATUS = new Set([502, 503, 504]);

/** Flips to true once one request has actually completed this page-load. */
let firstRequestDone = false;

export function hasCompletedFirstRequest() {
  return firstRequestDone;
}

export function markFirstRequestComplete() {
  firstRequestDone = true;
}

/* ------------------------------------------------------------------ */
/* Typed error                                                         */
/* ------------------------------------------------------------------ */

/**
 * @typedef {'network'|'timeout'|'aborted'|'http'|'parse'} ApiErrorKind
 */
export class ApiError extends Error {
  /**
   * @param {string} message   developer-facing message
   * @param {{kind?: ApiErrorKind, status?: number|null, detail?: any, cause?: any}} [meta]
   */
  constructor(message, { kind = 'http', status = null, detail = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
    this.cause = cause;
  }

  get isNetwork() { return this.kind === 'network'; }
  get isTimeout() { return this.kind === 'timeout'; }
  get isAborted() { return this.kind === 'aborted'; }
  get isNotFound() { return this.status === 404; }
  get isBadRequest() { return this.status === 400; }
  get isServerError() { return typeof this.status === 'number' && this.status >= 500; }

  /**
   * Retryable = network failures, timeouts (the server was likely still waking),
   * and the three gateway statuses Render emits while a service spins up.
   */
  get isRetryable() {
    if (this.kind === 'network') return true;
    if (this.kind === 'timeout') return true;
    return this.kind === 'http' && RETRYABLE_STATUS.has(this.status);
  }

  /** Always safe to render straight into the UI. */
  get userMessage() {
    switch (this.kind) {
      case 'network':
        return "Can't reach the SynthGuard server. Check your connection and try again.";
      case 'timeout':
        return 'The server took too long to respond. It may still be waking up — try again in a moment.';
      case 'aborted':
        return 'Request cancelled.';
      default:
        break;
    }
    if (this.status === 400) return this.detail || 'The server rejected that request.';
    if (this.status === 404) return this.detail || "That resource doesn't exist.";
    if (this.status === 413) return 'That file is too large for the server to accept.';
    if (this.status === 422) return this.detail || "Some of those values weren't valid.";
    if (this.isServerError) return this.detail || 'The server ran into a problem. Please try again.';
    return this.detail || this.message;
  }
}

/** Duck-typed abort check that works for ApiError and DOMException alike. */
export function isAbortError(err) {
  return (
    err?.name === 'AbortError' ||
    err?.kind === 'aborted' ||
    err?.code === 20
  );
}

/* ------------------------------------------------------------------ */
/* Low-level plumbing                                                  */
/* ------------------------------------------------------------------ */

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(id);
        reject(new ApiError('Request cancelled.', { kind: 'aborted' }));
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * fetch() + an AbortController-driven timeout.
 * Distinguishes "we timed out" from "the caller cancelled" from "the network died".
 */
async function rawFetch(url, { method = 'GET', body, headers, signal, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, {
      method,
      body,
      headers,
      signal: controller.signal,
      // No credentials: the backend is a public API and we hold no session cookie.
      credentials: 'omit',
      mode: 'cors',
    });
  } catch (err) {
    if (timedOut) {
      throw new ApiError(
        `Request to ${url} timed out after ${Math.round(timeoutMs / 1000)}s`,
        { kind: 'timeout', cause: err },
      );
    }
    if (signal?.aborted) {
      throw new ApiError('Request cancelled.', { kind: 'aborted', cause: err });
    }
    throw new ApiError(
      `Network request to ${url} failed`,
      { kind: 'network', cause: err },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

async function readJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * FastAPI returns `{detail: "..."}` for 400/404 and
 * `{detail: [{loc, msg, type}, ...]}` for 422. Normalise both to a string.
 */
function extractDetail(data) {
  if (!data || typeof data !== 'object') return null;
  const { detail } = data;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'string' ? d : d?.msg || JSON.stringify(d)))
      .join('; ');
  }
  if (detail && typeof detail === 'object') return detail.message || JSON.stringify(detail);
  if (typeof data.message === 'string') return data.message;
  return null;
}

/**
 * Run `fn` with exponential backoff.
 * Retries ONLY when the thrown ApiError is `.isRetryable`.
 */
export async function withRetry(fn, { retries = MAX_RETRIES, signal, onRetry } = {}) {
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  for (;;) {
    try {
      return await fn(attempt);
    } catch (err) {
      const canRetry =
        err instanceof ApiError &&
        err.isRetryable &&
        attempt < retries &&
        !signal?.aborted;

      if (!canRetry) throw err;

      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 250;
      onRetry?.({ attempt: attempt + 1, of: retries, delay, error: err });
      await sleep(delay, signal);
      attempt += 1;
    }
  }
}

/**
 * Core JSON request used by every endpoint below.
 * Automatically picks the 90s cold-start timeout for the first request after load.
 */
async function requestJson(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    signal,
    timeoutMs,
    retries = MAX_RETRIES,
    onRetry,
  } = options;

  const url = `${API_BASE}${path}`;
  const effectiveTimeout =
    timeoutMs ?? (firstRequestDone ? DEFAULT_TIMEOUT_MS : FIRST_REQUEST_TIMEOUT_MS);

  return withRetry(
    async () => {
      const res = await rawFetch(url, {
        method,
        body,
        headers,
        signal,
        timeoutMs: effectiveTimeout,
      });

      const data = await readJsonSafely(res);

      if (!res.ok) {
        const detail = extractDetail(data);
        throw new ApiError(
          typeof detail === 'string' && detail
            ? detail
            : `Request to ${path} failed with status ${res.status}`,
          { kind: 'http', status: res.status, detail },
        );
      }

      if (data === null) {
        throw new ApiError(`Server returned an unreadable response for ${path}.`, {
          kind: 'parse',
          status: res.status,
        });
      }

      firstRequestDone = true;
      return data;
    },
    { retries, signal, onRetry },
  );
}

/* ------------------------------------------------------------------ */
/* Cold start                                                          */
/* ------------------------------------------------------------------ */

/**
 * Silent wake ping. Called once on app load by useServerStatus.
 * Never throws — resolves to true (server answered) or false (still asleep / offline).
 */
export async function wakeServer({ signal, timeoutMs = WAKE_TIMEOUT_MS } = {}) {
  try {
    const res = await rawFetch(`${API_BASE}/openapi.json`, {
      method: 'GET',
      signal,
      timeoutMs,
      headers: { Accept: 'application/json' },
    });
    // Any HTTP answer means the box is awake, even a 404 from a misconfigured proxy.
    markFirstRequestComplete();
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* 1. POST /upload                                                     */
/* ------------------------------------------------------------------ */

/**
 * @param {File} file
 * @param {{maxRows?: number, signal?: AbortSignal, onRetry?: Function}} [opts]
 * @returns {Promise<{dataset_id: string, profile: object, row_count: number}>}
 */
export async function uploadDataset(file, { maxRows = 5000, signal, onRetry } = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('max_rows', String(maxRows));

  // NOTE: never set Content-Type manually — the browser must add the multipart boundary.
  return requestJson('/upload', {
    method: 'POST',
    body: form,
    signal,
    onRetry,
    // 90s if this is the very first call of the session, 120s otherwise.
    timeoutMs: firstRequestDone ? UPLOAD_TIMEOUT_MS : FIRST_REQUEST_TIMEOUT_MS,
  });
}

/* ------------------------------------------------------------------ */
/* 2. POST /generate                                                   */
/* ------------------------------------------------------------------ */

/**
 * @param {{datasetId: string, targetCol: string, epsilon: number|string,
 *          nRows?: number|string|null, signal?: AbortSignal, onRetry?: Function}} opts
 * @returns {Promise<{job_id: string, status: 'pending'}>}
 */
export async function generateSynthetic({
  datasetId,
  targetCol,
  epsilon,
  nRows,
  signal,
  onRetry,
}) {
  const form = new FormData();
  form.append('dataset_id', datasetId);
  form.append('target_col', targetCol);
  form.append('epsilon', String(epsilon));

  // Only include n_rows when the user actually supplied a value.
  const hasN = nRows !== undefined && nRows !== null && String(nRows).trim() !== '';
  if (hasN) form.append('n_rows', String(nRows));

  return requestJson('/generate', { method: 'POST', body: form, signal, onRetry });
}

/* ------------------------------------------------------------------ */
/* 3. GET /jobs/{job_id}                                               */
/* ------------------------------------------------------------------ */

/**
 * Polled by usePolling, so retries are disabled — the next tick is 3s away.
 * @returns {Promise<{job_id: string, status: string, result?: object, error?: string}>}
 */
export async function getJob(jobId, { signal } = {}) {
  return requestJson(`/jobs/${encodeURIComponent(jobId)}`, { signal, retries: 0 });
}

/* ------------------------------------------------------------------ */
/* 4. GET /download/{job_id}                                           */
/* ------------------------------------------------------------------ */

/**
 * Returns the FULL synthetic dataset as a JSON array of row objects.
 * Only call this on an explicit user download action — never on page load.
 * @returns {Promise<object[]>}
 */
export async function downloadDataset(jobId, { signal } = {}) {
  const data = await requestJson(`/download/${encodeURIComponent(jobId)}`, {
    signal,
    timeoutMs: 90_000,
  });
  if (!Array.isArray(data)) {
    throw new ApiError('The download endpoint returned an unexpected shape.', {
      kind: 'parse',
    });
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Helpers shared with the UI                                          */
/* ------------------------------------------------------------------ */

/**
 * Target Column Rule — the backend's utility check trains a classifier, so a
 * column is only usable as a target when it's categorical, or numeric with a
 * small number of distinct values.
 *
 * @param {{name: string, type: string, unique_count?: number|null}} column
 */
export function isQualifyingTargetColumn(column) {
  if (!column) return false;
  const { type, unique_count: uniqueCount } = column;

  if (type === 'categorical') return true;

  if (type === 'numeric') {
    // high-cardinality numerics are treated as continuous, not classes
    return typeof uniqueCount === 'number' && uniqueCount > 0 && uniqueCount <= 20;
  }

  // identifier, text, datetime are never selectable
  return false;
}

/** Filter a profile's columns down to the ones allowed as a target. */
export function getTargetCandidates(columns = []) {
  return columns.filter(isQualifyingTargetColumn);
}

/** Plain-language reason a column can't be a target — used in the UI tooltip/list. */
export function explainTargetExclusion(column) {
  if (!column) return 'Not available.';
  switch (column.type) {
    case 'identifier':
      return 'Identifier columns are unique per row, so a classifier cannot learn them as a class.';
    case 'text':
      return 'Free-text columns have no fixed set of classes to predict.';
    case 'datetime':
      return 'Date and time columns are continuous, not classes.';
    case 'numeric':
      return `Numeric with ${column.unique_count ?? 'many'} distinct values — too many classes to train a stable classifier.`;
    default:
      return 'This column type cannot be used as a target.';
  }
}

/** Columns the backend will not synthesise (excluded before training). */
export function getExcludedColumns(columns = []) {
  return columns.filter((c) => c.type === 'identifier' || c.is_pii === true);
}

/** Columns that actually go through the model. */
export function getSynthesizedColumns(columns = []) {
  return columns.filter((c) => c.type !== 'identifier' && c.is_pii !== true);
}

/** Scoring bands used on the results page and sample report. */
export const SCORE_BANDS = [
  { min: 85, label: 'Excellent' },
  { min: 70, label: 'Good' },
  { min: 50, label: 'Fair' },
  { min: 0, label: 'Weak' },
];

export function gradeForScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return SCORE_BANDS.find((b) => score >= b.min)?.label ?? null;
}