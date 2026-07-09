import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import { App } from './App';
import { STORAGE_KEY } from './store/migrations';

function initColorScheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { colorScheme?: string } };
    const scheme = parsed.state?.colorScheme;
    if (scheme === 'dark') document.documentElement.classList.add('dark');
  } catch {
    // ignore corrupt storage
  }
}

initColorScheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
