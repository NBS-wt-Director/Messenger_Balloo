// Smoke-тесты shared error-экранов (тик. 1794892002)
// 1_00_04 503, 1_00_05 offline-authed, 1_00_06 offline-guest,
// 1_00_07 555 ban, 1_00_08 ban-appeal (оверлей).
// Проверяют: экран рендерится и содержит текстовый маркер из макета.
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderScreen } from '../helpers/screenTestUtils';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import('../helpers/apiSpyMock');
  return { api: createUniversalApiMock() };
});

import Error503Screen from '../../screens/shared/Error503Screen';
import OfflineAuthedScreen from '../../screens/shared/OfflineAuthedScreen';
import OfflineGuestScreen from '../../screens/shared/OfflineGuestScreen';
import Error555Screen from '../../screens/shared/Error555Screen';
import BanAppealScreen from '../../screens/shared/BanAppealScreen';

describe('Shared error screens (smoke)', () => {
  const cases: [string, React.ReactNode, string][] = [
    ['Error503Screen', <Error503Screen />, 'Сервис недоступен'],
    ['OfflineAuthedScreen', <OfflineAuthedScreen />, 'Нет соединения с интернетом'],
    ['OfflineGuestScreen', <OfflineGuestScreen />, 'Нет соединения с интернетом'],
    ['Error555Screen', <Error555Screen />, 'Аккаунт заблокирован'],
    ['BanAppealScreen', <BanAppealScreen />, 'Обжалование бана'],
  ];

  for (const [name, ui, marker] of cases) {
    it(`${name} renders with layout marker`, async () => {
      const { container } = renderScreen(ui);
      expect(container.firstChild).not.toBeNull();
      await waitFor(
        () => {
          expect(container.textContent || '').toContain(marker);
        },
        { timeout: 1000 }
      );
    });
  }
});
