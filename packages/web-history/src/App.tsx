// App.tsx — задел варианта А для history.balloo.su
// Экраны: version-list, version-detail (mockups/history-balloo-su/)
// Пока — минимальный SPA-роутер, заглушка под контент из mockups/

import { HashRouter, Routes, Route } from 'react-router-dom';

function HistoryList() {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>История версий Balloo</h1>
      <p>Раздел в разработке. Макет-эталон: mockups/history-balloo-su/version-list.html</p>
    </div>
  );
}

function VersionDetail() {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>Детали версии</h1>
      <p>Раздел в разработке.</p>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HistoryList />} />
        <Route path="/:versionId" element={<VersionDetail />} />
      </Routes>
    </HashRouter>
  );
}
