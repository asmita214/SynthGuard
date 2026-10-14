// src/hooks/useServerStatus.js
//
// Render's free tier sleeps after inactivity and can take ~60s to wake.
// On app load we fire one silent GET /openapi.json and publish the result
// globally so the nav, the workspace and the job page can all show it.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { wakeServer } from '../lib/api';

/** @typedef {'waking'|'online'|'offline'} ServerStatus */

const AUTO_RETRY_MS = 15_000;   // while offline, keep probing politely
const RECHECK_MS = 5 * 60_000;  // periodic liveness check while online

const ServerStatusContext = createContext(null);

export function ServerStatusProvider({ children }) {
  /** @type {[ServerStatus, Function]} */
  const [status, setStatus] = useState('waking');
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [checkCount, setCheckCount] = useState(0);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const abortRef = useRef(null);

  const check = useCallback(async () => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Only show "waking" if we aren't already known-good.
    setStatus((prev) => (prev === 'online' ? prev : 'waking'));

    const ok = await wakeServer({ signal: controller.signal });

    inFlightRef.current = false;
    if (!mountedRef.current || controller.signal.aborted) return ok;

    setStatus(ok ? 'online' : 'offline');
    setLastCheckedAt(Date.now());
    setCheckCount((n) => n + 1);
    return ok;
  }, []);

  /* initial wake ping */
  useEffect(() => {
    mountedRef.current = true;
    check();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [check]);

  /* retry while offline / periodic liveness while online */
  useEffect(() => {
    if (status === 'waking') return undefined;

    const delay = status === 'offline' ? AUTO_RETRY_MS : RECHECK_MS;
    const id = setTimeout(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      check();
    }, delay);

    return () => clearTimeout(id);
  }, [status, checkCount, check]);

  /* re-probe when the tab comes back to the foreground */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const stale = !lastCheckedAt || Date.now() - lastCheckedAt > 60_000;
      if (stale || status !== 'online') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check, lastCheckedAt, status]);

  const value = useMemo(
    () => ({
      /** @type {ServerStatus} */
      status,
      isWaking: status === 'waking',
      isOnline: status === 'online',
      isOffline: status === 'offline',
      lastCheckedAt,
      /** Manual re-probe, wired to the "Retry" button next to the status pill. */
      retry: check,
    }),
    [status, lastCheckedAt, check],
  );

  return createElement(ServerStatusContext.Provider, { value }, children);
}

/** Read the global server status. Must be used inside <ServerStatusProvider>. */
export function useServerStatus() {
  const ctx = useContext(ServerStatusContext);
  if (!ctx) {
    throw new Error('useServerStatus must be used inside <ServerStatusProvider>.');
  }
  return ctx;
}