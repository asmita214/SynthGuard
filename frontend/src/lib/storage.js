

const RUNS_KEY = 'synthguard.runs.v1';
const ROADMAP_EMAIL_KEY = 'synthguard.roadmap.email.v1';
const MAX_RUNS = 100;

/* ------------------------------------------------------------------ */
/* Low-level safe primitives                                           */
/* ------------------------------------------------------------------ */

function safeGet(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readJson(key, fallback) {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    // Corrupt entry — drop it so the app self-heals.
    safeRemove(key);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    return safeSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Runs (History / Compare)                                            */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} RunRecord
 * @property {string}      job_id
 * @property {string}      filename
 * @property {string}      target_col
 * @property {number}      epsilon            requested epsilon
 * @property {string}      created_at         ISO timestamp
 * @property {number|null} synthguard_score   filled in once the run completes
 * @property {'pending'|'running'|'completed'|'failed'} status
 * @property {number|null} [epsilon_achieved]
 * @property {string|null} [error]
 * @property {number|null} [duration_ms]
 */

/** @returns {RunRecord[]} newest first */
export function getRuns() {
  const runs = readJson(RUNS_KEY, []);
  if (!Array.isArray(runs)) return [];
  return runs
    .filter((r) => r && typeof r === 'object' && typeof r.job_id === 'string')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getRun(jobId) {
  if (!jobId) return null;
  return getRuns().find((r) => r.job_id === jobId) ?? null;
}

/**
 * Insert a run, or merge into the existing record with the same job_id.
 * Called right after a successful POST /generate.
 * @param {Partial<RunRecord> & {job_id: string}} run
 * @returns {RunRecord|null} the stored record
 */
export function saveRun(run) {
  if (!run?.job_id) return null;

  const now = new Date().toISOString();
  const existing = getRuns();
  const index = existing.findIndex((r) => r.job_id === run.job_id);

  /** @type {RunRecord} */
  const record = {
    job_id: run.job_id,
    filename: run.filename ?? 'Untitled dataset',
    target_col: run.target_col ?? '',
    epsilon: typeof run.epsilon === 'number' ? run.epsilon : Number(run.epsilon) || 0,
    created_at: run.created_at ?? (index >= 0 ? existing[index].created_at : now),
    synthguard_score: run.synthguard_score ?? null,
    status: run.status ?? 'pending',
    epsilon_achieved: run.epsilon_achieved ?? null,
    error: run.error ?? null,
    duration_ms: run.duration_ms ?? null,
  };

  if (index >= 0) existing[index] = { ...existing[index], ...record };
  else existing.unshift(record);

  writeJson(RUNS_KEY, existing.slice(0, MAX_RUNS));
  return record;
}

/**
 * Patch a run — used by the job page as the run moves pending → completed/failed.
 * @param {string} jobId
 * @param {Partial<RunRecord>} patch
 */
export function updateRun(jobId, patch = {}) {
  if (!jobId) return null;
  const runs = getRuns();
  const index = runs.findIndex((r) => r.job_id === jobId);
  if (index < 0) return null;
  runs[index] = { ...runs[index], ...patch };
  writeJson(RUNS_KEY, runs);
  return runs[index];
}

/** Local-only delete. Does not touch the backend. */
export function deleteRun(jobId) {
  if (!jobId) return false;
  const next = getRuns().filter((r) => r.job_id !== jobId);
  return writeJson(RUNS_KEY, next);
}

/** Local-only clear. Does not touch the backend. */
export function clearRuns() {
  safeRemove(RUNS_KEY);
}

/** Only runs the backend can still serve a result for. */
export function getCompletedRuns() {
  return getRuns().filter((r) => r.status === 'completed');
}

/* ------------------------------------------------------------------ */
/* Roadmap email capture — LOCAL ONLY, NEVER SUBMITTED ANYWHERE        */
/* ------------------------------------------------------------------ */

/**
 * Persists an email address in localStorage purely so the roadmap page can
 * say "you're on the list". There is deliberately no fetch() here and no
 * backend endpoint behind it.
 */
export function saveRoadmapEmail(email) {
  const value = String(email ?? '').trim();
  if (!value) return false;
  return writeJson(ROADMAP_EMAIL_KEY, { email: value, saved_at: new Date().toISOString() });
}

export function getRoadmapEmail() {
  const data = readJson(ROADMAP_EMAIL_KEY, null);
  return typeof data?.email === 'string' ? data.email : null;
}

export function clearRoadmapEmail() {
  safeRemove(ROADMAP_EMAIL_KEY);
}