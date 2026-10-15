// Проверка рендера страницы донатов: подпись «Сбербанк (СБП)» и номер +7 912 202-30-35
// Тикет 1792062710 — решение владельца 1.2.3 (номер подтверждён, указывать Сбербанк)
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderScreen } from '../helpers/screenTestUtils';
import { DonateScreen } from '../../screens/donate/DonateScreen';

describe('DonateScreen — реквизиты донатов (В-67/1.2.3)', () => {
  it('рендерит подпись «Сбербанк (СБП)» и подтверждённый номер', () => {
    // fetch('/api/payments/config') в jsdom не резолвится → работает FALLBACK-конфиг
    renderScreen(<DonateScreen />);

    expect(screen.getByText('Сбербанк (СБП)')).toBeTruthy();
    expect(screen.getByText('+7 912 202-30-35')).toBeTruthy();
    expect(screen.getByText('📞 Перевод по номеру')).toBeTruthy();
  });
});
