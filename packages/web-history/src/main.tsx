import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Стили узла (тик. 1795683301): токены тем и шапка/подвал — из @balloo/ui,
// прокрутка без полосы и отступы контента — локально.
import './styles/global.css';
import '@balloo/ui/styles/themes.css';
import '@balloo/ui/styles/chrome.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
