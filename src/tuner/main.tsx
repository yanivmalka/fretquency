import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { LanguageProvider } from '../i18n/LanguageContext';
import TunerScreen from '../components/TunerScreen';

// A standalone, crawlable entry point for the tuner (separate from the
// in-app TunerScreen takeover reached via the main app's drawer) — same
// production component, just mounted on its own so search engines and
// direct links land straight on it instead of the full app shell. "Close"
// here means "go to the full app" rather than returning to a prior screen.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <TunerScreen onClose={() => { window.location.href = import.meta.env.BASE_URL; }} />
    </LanguageProvider>
  </StrictMode>,
);
