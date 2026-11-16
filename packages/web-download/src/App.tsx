// App.tsx — задел варианта А для download.balloo.su
// Экран: downloads (mockups/download-balloo-su/)
// Пока — минимальный SPA-роутер, заглушка под контент из mockups/

import { HashRouter, Routes, Route } from 'react-router-dom';

function DownloadList() {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>Скачать Balloo</h1>
      <p>Раздел в разработке. Макет-эталон: mockups/download-balloo-su/downloads.html</p>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DownloadList />} />
      </Routes>
    </HashRouter>
  );
}
