// src/hooks/usePolling.js
//
// Polls GET /jobs/{job_id} for a single run.
//
// Rules implemented here:
//   - poll every 3 seconds; after 2 minutes of polling, slow to every 6 seconds
//   - stop on "completed", on "failed", on unmount, or when `enabled` goes false
//   - track elapsed time since the job started (1s ticker)
//   - past 15 minutes while still pending/running → isStale (server may have
//     restarted mid-run on Render's free tier). We never claim it definitely failed.
//   - tolerate transient poll failures; give up after 5 consecutive errors

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getJob, isAbortError } from '../lib/api';

export const FAST_INTERVAL_MS = 3_000;
export const SLOW_INTERVAL_MS = 6_000;
export const SLOW_AFTER_MS = 2 * 60_000;
export const STALE_AFTER_MS = 15 * 60_000;
const MAX_CONSECUTIVE_ERRORS = 5;

function intervalFor(elapsedMs) {
  return elapsedMs >= SLOW_AFTER_MS ? SLOW_INTERVAL_MS : FAST_INTERVAL_MS;
}

/** "4m 12s" / "37s" / "1h 02m" */
export function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

/**
 * @param {string|null|undefined} jobId
 * @param {{
 *   enabled?: boolean,
 *   startedAt?: number|null,
 *   onCompleted?: (job: object) => void,
 *   onFailed?: (job: object) => void,
 *   onError?: (error: Error) => void,
 * }} [options]
 */
export function usePolling(jobId, options = {}) {
  const {
    enabled = true,
    startedAt = null,
    onCompleted,
    onFailed,
    onError,
  } = options;

  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [nonce, setNonce] = useState(0);

  const startRef = useRef(startedAt ?? Date.now());
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const cancelledRef = useRef(false);
  const errorStreakRef = useRef(0);
  const callbacksRef = useRef({ onCompleted, onFailed, onError });

  callbacksRef.current = { onCompleted, onFailed, onError };

  const status = job?.status ?? null;

  const isTerminal = status === 'completed' || status === 'failed';
  const isActive = Boolean(enabled && jobId) && !isTerminal;

  /** Manual restart — wired to the "Try again" button on transient poll errors. */
  const restart = useCallback(() => {
    errorStreakRef.current = 0;
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  /* ---------------------------------------------------------------- */
  /* polling loop                                                     */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!jobId || !enabled) return undefined;

    // Reset per-job state.
    cancelledRef.current = false;
    errorStreakRef.current = 0;
    startRef.current = startedAt ?? Date.now();
    setJob(null);
    setError(null);
    setElapsedMs(0);
    setIsPolling(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const schedule = (delay) => {
      if (cancelledRef.current) return;
      timerRef.current = setTimeout(tick, delay);
    };

    async function tick() {
      if (cancelledRef.current) return;

      try {
        const data = await getJob(jobId, { signal: controller.signal });
        if (cancelledRef.current) return;

        errorStreakRef.current = 0;
        setError(null);
        setJob(data);

        if (data?.status === 'completed') {
          setIsPolling(false);
          callbacksRef.current.onCompleted?.(data);
          return;
        }
        if (data?.status === 'failed') {
          setIsPolling(false);
          callbacksRef.current.onFailed?.(data);
          return;
        }

        schedule(intervalFor(Date.now() - startRef.current));
      } catch (err) {
        if (cancelledRef.current || isAbortError(err)) return;

        errorStreakRef.current += 1;

        // A 404 means the job genuinely isn't there — don't keep hammering.
        if (err?.status === 404) {
          setError(err);
          setIsPolling(false);
          callbacksRef.current.onError?.(err);
          return;
        }

        if (errorStreakRef.current >= MAX_CONSECUTIVE_ERRORS) {
          setError(err);
          setIsPolling(false);
          callbacksRef.current.onError?.(err);
          return;
        }

        // Otherwise keep the run alive and try again on the next tick.
        setError(err);
        schedule(intervalFor(Date.now() - startRef.current));
      }
    }

    tick();

    return () => {
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      controller.abort();
    };
    // `nonce` is intentional: restart() re-runs the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled, startedAt, nonce]);

  /* ---------------------------------------------------------------- */
  /* 1-second elapsed ticker, stops once the job reaches a terminal   */
  /* state so the frozen number is the real run duration              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!jobId || !enabled) return undefined;

    const update = () => setElapsedMs(Date.now() - startRef.current);
    update();

    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [jobId, enabled, startedAt, nonce]);

  /* stop ticking as soon as the job lands in a terminal state */
  useEffect(() => {
    if (!isTerminal) return undefined;
    setElapsedMs(Date.now() - startRef.current);
    return undefined;
  }, [isTerminal]);

  return useMemo(
    () => ({
      /** Latest raw job payload, or null before the first tick. */
      job,
      /** 'pending' | 'running' | 'completed' | 'failed' | null */
      status,
      /** Last poll error, if any (a stale one may still be shown while retrying). */
      error,
      /** Live elapsed time since the job started. */
      elapsedMs,
      elapsedLabel: formatElapsed(elapsedMs),
      /** True while the hook is still scheduling polls. */
      isPolling,
      /** The job exists and hasn't reached a terminal state. */
      isActive,
      /** We've been polling long enough to be on the slow interval. */
      isSlow: elapsedMs >= SLOW_AFTER_MS,
      /**
       * Past 15 minutes and still pending/running — Render's free tier may have
       * restarted mid-run. Show the "start a new run" affordance, never "it failed".
       */
      isStale: isActive && elapsedMs >= STALE_AFTER_MS,
      /** Manually restart polling (e.g. after a burst of transient errors). */
      restart,
    }),
    [job, status, error, elapsedMs, isPolling, isActive, restart],
  );
}