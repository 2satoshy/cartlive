import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initTelegramAuth} from './utils/telegram';

// No-op outside a real Telegram client — see utils/telegram.ts.
void initTelegramAuth();

// Prevent harmless WebSocket/HMR and network disconnect error popups in preview sandbox
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  const messageStr = String(event.reason?.message || '');
  if (
    reasonStr.includes('WebSocket') ||
    messageStr.includes('WebSocket') ||
    reasonStr.includes('Failed to fetch') ||
    messageStr.includes('Failed to fetch')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

