import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('App bootstrap failed', error);
  rootElement.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center;color:#e2e8f0;background:#050510;">
      <div>
        <h1 style="margin:0 0 0.75rem 0;font-family:serif;">Omni-Cosmos</h1>
        <p style="margin:0 0 0.5rem 0;">The page did not load correctly.</p>
        <p style="margin:0;color:#94a3b8;">Please refresh once. If the issue continues, clear site cache and reload.</p>
      </div>
    </main>
  `;
}