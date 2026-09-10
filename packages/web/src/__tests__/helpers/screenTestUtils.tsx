import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/**
 * Рендер экрана в MemoryRouter (для useNavigate/useParams/useLocation).
 */
export function renderScreen(ui: React.ReactNode, route = '/'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}
