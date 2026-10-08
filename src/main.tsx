import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Diagnostic, ErrorBoundary } from './diagnostics';
import { loadExperience } from './spec/load';
import type { Experience } from './spec/schema';
import './style.css';

function Loader() {
  const [spec, setSpec] = useState<Experience>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const next = await loadExperience(location.search, controller.signal);
        if (controller.signal.aborted) return;
        document.title = next.title;
        document.documentElement.lang = next.locale;
        setSpec(next);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  return spec ? <App spec={spec} /> : <Diagnostic error={error} />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><Loader /></ErrorBoundary></StrictMode>);
