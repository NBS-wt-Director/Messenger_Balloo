import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@balloo/web/styles/global.css';
import '@balloo/web/styles/themes.css';
import './styles/desktop.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
