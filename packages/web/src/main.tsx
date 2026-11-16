// main.tsx — точка входа React приложения

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/themes.css';
import './styles/design-system.css';
import './styles/chat.css';
// P35: стили единой шапки/подвала из @balloo/ui (.topbar*, .balloo-footer*)
import '@balloo/ui/styles/chrome.css';

// Тикет 1794831100 (A.1): регистрация SW — только на прод-хостах.
// На dev-сервере Vite сам отдаёт всё по-новому, SW будет мешать hot-reload.
if ('serviceWorker' in navigator) {
  const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isDev) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] регистрация не удалась:', err);
      });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
