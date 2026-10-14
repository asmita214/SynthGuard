// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ServerStatusProvider } from './hooks/useServerStatus';
import { DatasetProvider } from './context/DatasetContext';
import { Layout } from './components/Layout';

import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { Privacy } from './pages/Privacy';
import { ApiDocs } from './pages/ApiDocs';
import { Roadmap } from './pages/Roadmap';
import { SampleReport } from './pages/SampleReport';
import { UseCases } from './pages/UseCases';
import { Workspace } from './pages/app/Workspace';
import { JobPage } from './pages/app/JobPage';
import { History } from './pages/History';
import { Compare } from './pages/Compare';

export default function App() {
  return (
    <BrowserRouter>
      <ServerStatusProvider>
        <DatasetProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />

              <Route path="/how-it-works"  element={<HowItWorks />} />
              <Route path="/sample-report" element={<SampleReport />} />
              <Route path="/use-cases"     element={<UseCases />} />
              <Route path="/api-docs"      element={<ApiDocs />} />
              <Route path="/privacy"       element={<Privacy />} />
              <Route path="/roadmap"       element={<Roadmap />} />

              <Route path="/app"               element={<Workspace />} />
              <Route path="/app/job/:jobId"    element={<JobPage />} />
              <Route path="/history"           element={<History />} />
              <Route path="/compare"           element={<Compare />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DatasetProvider>
      </ServerStatusProvider>

      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid var(--color-line)',
            color: '#0b1a11',
            borderRadius: '14px',
            boxShadow: '0 8px 32px -12px rgba(11, 26, 17, 0.15)',
          },
        }}
      />
    </BrowserRouter>
  );
}