import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/themes.css';
import './styles/design-system.css';
// Layout classes (.main/.sidebar/.content/.tabs/.chip/.list) and page-level
// classes (.page-container/.page-title/...) were missing in web-features,
// breaking the features screens. Sourced from packages/web chat.css and
// mockups/assets/common.css respectively (mockups = source of truth).
import './styles/chat.css';
import './styles/page.css';
import '@balloo/ui/styles/chrome.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
