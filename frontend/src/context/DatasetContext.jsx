// Holds:
//   - the dataset_id returned by POST /upload
//   - the profile object returned alongside it
//   - the original filename
//   - the parsed CSV rows (PapaParse output) so the results page can build
//     real-vs-synthetic comparisons without re-uploading
//   - a small `pendingConfig` slot used by "Run again with different epsilon"
//
// Everything here is lost on a hard refresh — that is intentional. Nothing
// sensitive is written to localStorage (see src/lib/storage.js).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [datasetId, setDatasetId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [filename, setFilename] = useState(null);
  const [uploadedAt, setUploadedAt] = useState(null);

  // Parsed real rows live here for the whole session, so the results page can
  // chart real-vs-synthetic without re-fetching the CSV.
  const [rows, setRows] = useState(null);
  const [columns, setColumns] = useState(null);

  // Preset values handed back from the results page when the user asks to
  // re-run the same dataset with different configuration.
  const [pendingConfig, setPendingConfig] = useState(null);

  // Keep a stable ref so consumers can read the latest snapshot without
  // re-subscribing every render.
  const snapshotRef = useRef({});
  snapshotRef.current = { datasetId, profile, filename, rows, columns };

  const setDataset = useCallback(({ datasetId: id, profile: p, filename: name, rows: r, columns: c }) => {
    setDatasetId(id ?? null);
    setProfile(p ?? null);
    setFilename(name ?? null);
    setRows(Array.isArray(r) ? r : null);
    setColumns(Array.isArray(c) ? c : null);
    setUploadedAt(Date.now());
  }, []);

  const setParsedCsv = useCallback(({ rows: r, columns: c }) => {
    setRows(Array.isArray(r) ? r : null);
    setColumns(Array.isArray(c) ? c : null);
  }, []);

  const clear = useCallback(() => {
    setDatasetId(null);
    setProfile(null);
    setFilename(null);
    setUploadedAt(null);
    setRows(null);
    setColumns(null);
    setPendingConfig(null);
  }, []);

  const value = useMemo(
    () => ({
      datasetId,
      profile,
      filename,
      uploadedAt,
      rows,
      columns,

      hasDataset: Boolean(datasetId && profile),
      hasParsedRows: Boolean(rows && rows.length),

      setDataset,
      setParsedCsv,
      clear,

      pendingConfig,
      setPendingConfig,
      clearPendingConfig: () => setPendingConfig(null),

      /** Read the latest snapshot without causing a re-render (useful in effects). */
      getSnapshot: () => snapshotRef.current,
    }),
    [datasetId, profile, filename, uploadedAt, rows, columns, pendingConfig, setDataset, setParsedCsv, clear],
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used inside <DatasetProvider>.');
  return ctx;
}