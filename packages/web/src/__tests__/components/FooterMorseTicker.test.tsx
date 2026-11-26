// Морзе-тикер подвала: store-приоритеты и рендер (тикет 1795677854).

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import {
  I18nProvider,
  Footer,
  FooterMorseTicker,
  useFooterTickerStore,
  useUIStore,
} from '@balloo/ui';

beforeEach(() => {
  useFooterTickerStore.getState().clear();
  useUIStore.getState().setLanguage('ru');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFooterTickerStore — приоритеты', () => {
  it('по умолчанию idle', () => {
    const s = useFooterTickerStore.getState();
    expect(s.mode).toBe('idle');
    expect(s.left).toBe('');
    expect(s.right).toBe('');
  });

  it('уведомление ставит режим notification с источником и телом', () => {
    useFooterTickerStore.getState().setNotification({ source: 'Чат', body: 'Привет' });
    const s = useFooterTickerStore.getState();
    expect(s.mode).toBe('notification');
    expect(s.left).toBe('Чат');
    expect(s.right).toBe('Привет');
  });

  it('update перебивает notification, notification не перебивает update', () => {
    const store = useFooterTickerStore.getState();
    store.setUpdate({ right: 'Обновление в 12:00' });
    expect(useFooterTickerStore.getState().mode).toBe('update');

    store.setNotification({ source: 'Чат', body: 'Привет' });
    expect(useFooterTickerStore.getState().mode).toBe('update');
    expect(useFooterTickerStore.getState().right).toBe('Обновление в 12:00');
  });

  it('emergency перебивает update, обратное понижение невозможно', () => {
    const store = useFooterTickerStore.getState();
    store.setEmergency({ left: 'ЧС', right: 'Пожар' });
    expect(useFooterTickerStore.getState().mode).toBe('emergency');

    store.setUpdate({ right: 'Обновление' });
    expect(useFooterTickerStore.getState().mode).toBe('emergency');

    store.setNotification({ source: 'Чат', body: 'Привет' });
    expect(useFooterTickerStore.getState().mode).toBe('emergency');
  });

  it('автосброс в idle по TTL', () => {
    vi.useFakeTimers();
    useFooterTickerStore.getState().setNotification({ source: 'Чат', body: 'Привет', ttlMs: 1000 });
    expect(useFooterTickerStore.getState().mode).toBe('notification');

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(useFooterTickerStore.getState().mode).toBe('idle');
  });

  it('clear сбрасывает в idle', () => {
    useFooterTickerStore.getState().setNotification({ source: 'Чат', body: 'Привет' });
    useFooterTickerStore.getState().clear();
    expect(useFooterTickerStore.getState().mode).toBe('idle');
  });
});

describe('FooterMorseTicker — рендер', () => {
  it('рисует точки и тире, а не текст буквами', () => {
    const { container } = render(<FooterMorseTicker text="SOS" direction="ltr" />);

    const cells = container.querySelectorAll('.balloo-footer__morse');
    expect(cells.length).toBeGreaterThan(0);

    // Внутри самого тикера нет читаемых букв исходного текста
    expect(container.querySelector('.balloo-footer__ticker')?.textContent).not.toContain('SOS');

    // Точки и тире присутствуют
    expect(container.querySelectorAll('.balloo-footer__morse--dot').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.balloo-footer__morse--dash').length).toBeGreaterThan(0);
  });

  it('показывает расшифровку в подсказке при наведении (тик. 1795721513)', () => {
    const { container } = render(<FooterMorseTicker text="SOS" direction="ltr" />);

    const tip = container.querySelector('[role="tooltip"]');
    expect(tip).not.toBeNull();
    expect(tip?.textContent).toBe('SOS');

    // Нативный fallback-тултип на самом тикере
    expect(container.querySelector('.balloo-footer__ticker')?.getAttribute('title')).toBe('SOS');
  });

  it('направление задаёт класс ltr/rtl', () => {
    const ltr = render(<FooterMorseTicker text="SOS" direction="ltr" />);
    expect(ltr.container.querySelector('.balloo-footer__ticker--ltr')).not.toBeNull();
    ltr.unmount();

    const rtl = render(<FooterMorseTicker text="SOS" direction="rtl" />);
    expect(rtl.container.querySelector('.balloo-footer__ticker--rtl')).not.toBeNull();
  });

  it('emergency — красный вариант', () => {
    const { container } = render(<FooterMorseTicker text="ЧС" direction="ltr" variant="emergency" />);
    expect(container.querySelector('.balloo-footer__ticker--emergency')).not.toBeNull();
  });

  it('пустой текст — ничего не рендерит', () => {
    const { container } = render(<FooterMorseTicker text="" direction="ltr" />);
    expect(container.querySelector('.balloo-footer__ticker')).toBeNull();
  });
});

describe('Footer — подключение тикера', () => {
  it('в idle два тикера: слоган слева и часовой пояс/город справа', () => {
    const { container } = render(
      <I18nProvider>
        <Footer />
      </I18nProvider>
    );

    const tickers = container.querySelectorAll('.balloo-footer__ticker');
    expect(tickers.length).toBe(2);
    expect(tickers[0].className).toContain('balloo-footer__ticker--ltr');
    expect(tickers[1].className).toContain('balloo-footer__ticker--rtl');

    // Старые декоративные точки убраны
    expect(container.querySelector('.balloo-footer__dots')).toBeNull();
  });

  it('активное уведомление заменяет слоган/город на источник/тело', () => {
    act(() => {
      useFooterTickerStore.getState().setNotification({ source: 'Чат', body: 'Привет' });
    });

    const { container } = render(
      <I18nProvider>
        <Footer />
      </I18nProvider>
    );

    // Оба тикера на месте, режим — уведомление
    expect(container.querySelectorAll('.balloo-footer__ticker').length).toBe(2);
    expect(useFooterTickerStore.getState().mode).toBe('notification');
  });
});
