// App.tsx — download.balloo.su: страницы загрузок приложений Balloo.
//
// Тик. 1795683301:
//   U1 — единые шапка/подвал из @balloo/ui (StandaloneChrome), узел не рисует свои;
//   U2/U3 — прокрутка внутри контейнера без полосы + горизонтальные отступы;
//   D1/U7 — платформа без собранного артефакта остаётся в списке, но с
//          текстом-извинением и БЕЗ битой ссылки;
//   D2 — настоящий QR (библиотека `qrcode`), значение — download.balloo.su.
//
// Раньше узел был заглушкой «Раздел в разработке».

import { HashRouter, Routes, Route } from 'react-router-dom';
import { StandaloneChrome } from '@balloo/ui';
import { DownloadPage } from './screens/DownloadPage';

export default function App() {
  return (
    <HashRouter>
      <StandaloneChrome title="Скачать Balloo">
        <Routes>
          <Route path="/" element={<DownloadPage />} />
          <Route path="*" element={<DownloadPage />} />
        </Routes>
      </StandaloneChrome>
    </HashRouter>
  );
}
