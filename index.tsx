import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Show error message in the root element
const showFatalError = (message: string) => {
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center;background:#050510;color:#e2e8f0;flex-direction:column;gap:1rem;">
        <h1 style="margin:0;font-family:serif;">Omni-Cosmos</h1>
        <p style="margin:0;color:#94a3b8;">The app failed to start. Please refresh the page.</p>
        <p style="margin:0;color:#64748b;font-size:0.75rem;max-width:480px;word-break:break-all;">${message}</p>
        <button onclick="window.location.reload()" style="margin-top:0.5rem;padding:0.5rem 1.5rem;background:#0e7490;color:#fff;border:none;border-radius:999px;cursor:pointer;font-weight:700;">Refresh</button>
      </div>
    `;
  }
};

// Catch any unhandled global JS errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showFatalError(String(event.error ?? event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  showFatalError(String(event.reason));
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  showFatalError('Root element not found.');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('App bootstrap failed', error);
    showFatalError(String(error));
  }
}