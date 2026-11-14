import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Дизайн-система и темы (тик. 1794575221): у web-admin не было НИ ОДНОГО
// theme-импорта — все var(--bg-primary)/var(--text-primary) в экранах
// оставались неопределёнными (страница рендерилась «браузерно-белой»).
// alias @ → ../web/src — берём те же файлы, что у balloo.su.
import '@/styles/global.css';
import '@/styles/themes.css';
import '@/styles/design-system.css';
import '@balloo/ui/styles/chrome.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
