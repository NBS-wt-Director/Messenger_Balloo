/**
 * Правое меню шапки (P38): подписи секции «Аккаунт».
 *
 * Причина тикета: в проде меню показывало сырые ключи «menu.profile»,
 * «menu.settings», «menu.accounts» — этих ключей в словаре не было, а t() при
 * отсутствии перевода возвращает сам ключ (packages/shared/src/i18n/translations.ts,
 * функция t). Ни сборка, ни CI не шумели: RightMenuItem.key был объявлен
 * `TranslationKey | string`, а scripts/check-i18n.cjs видел только литералы
 * t('…') и не смотрел на ключи, переданные через props.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nProvider, RightMenu, SUPPORTED_LANGUAGES, useUIStore } from '@balloo/ui';

/** Подписки пунктов авторизованного + ярлык самой секции (settings.account). */
const ACCOUNT_LABELS = ['Профиль', 'Контакты', 'Настройки', 'Аккаунты', 'Аккаунт'];
const RAW_KEYS = ['menu.profile', 'menu.contacts', 'menu.settings', 'menu.accounts'];

function renderMenu(props = {}) {
  const onNavigate = vi.fn();
  const onLogout = vi.fn();
  const view = render(
    <I18nProvider>
      <RightMenu onNavigate={onNavigate} onLogout={onLogout} {...props} />
    </I18nProvider>
  );
  // Панель закрыта по умолчанию и помечена aria-hidden, поэтому запросы по
  // роли видели бы пустоту — открываем меню кликом по триггеру. У триггера
  // имя берётся из содержимого (маскот/инициалы), поэтому ищем по id.
  fireEvent.click(view.container.querySelector('#balloo-menu-btn') as HTMLElement);
  return { onNavigate, onLogout, ...view };
}

beforeEach(() => {
  cleanup();
  // В jsdom navigator отдаёт en-US, поэтому русскую локаль задаём явно.
  useUIStore.getState().setLanguage('ru');
});

describe('RightMenu — подписи секции «Аккаунт»', () => {
  it('авторизованный: подписки переводом, сырых ключей нет', () => {
    renderMenu({ auth: 'user' });

    for (const label of ACCOUNT_LABELS) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    for (const raw of RAW_KEYS) {
      expect(screen.queryByText(raw)).toBeNull();
    }
  });

  it('авторизованный: клик по пункту ведёт на его маршрут', () => {
    const { onNavigate } = renderMenu({ auth: 'user' });

    fireEvent.click(screen.getByText('Профиль'));
    expect(onNavigate).toHaveBeenLastCalledWith('/profile');

    // В-12 (тикет 1790847000): «Контакты» добавлены в правое меню → /contacts
    fireEvent.click(screen.getByText('Контакты'));
    expect(onNavigate).toHaveBeenLastCalledWith('/contacts');

    fireEvent.click(screen.getByText('Настройки'));
    expect(onNavigate).toHaveBeenLastCalledWith('/settings');

    fireEvent.click(screen.getByText('Аккаунты'));
    expect(onNavigate).toHaveBeenLastCalledWith('/profile');
  });

  it('гость: «Войти» и «Регистрация», пунков аккаунта нет', () => {
    const { onNavigate, container } = renderMenu({ auth: 'guest' });

    // Кнопки содержат иконку, поэтому имя ищется по подстроке.
    const signIn = screen.getByRole('button', { name: /Войти/ });
    const signUp = screen.getByRole('button', { name: /Регистрация/ });

    fireEvent.click(signIn);
    expect(onNavigate).toHaveBeenLastCalledWith('/login');

    // Переход закрывает меню (go() → setOpen(false)) — открываем заново.
    fireEvent.click(container.querySelector('#balloo-menu-btn') as HTMLElement);
    fireEvent.click(signUp);
    expect(onNavigate).toHaveBeenLastCalledWith('/register');

    // Ярлык секции общий для гостя и авторизованного, а вот пунктов аккаунта
    // у гостя быть не должно.
    expect(screen.getAllByText('Аккаунт').length).toBeGreaterThan(0);
    for (const label of ['Профиль', 'Контакты', 'Настройки', 'Аккаунты']) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it('темы подписаны переводом, а не ключами menu.theme*', () => {
    renderMenu({ auth: 'user' });

    // Подпункт темы — «🌙 Тёмная» одним текстом, поэтому поиск по подстроке.
    for (const label of ['Тёмная', 'Светлая', 'Наша']) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
    }
    for (const raw of ['menu.themeDark', 'menu.themeLight', 'menu.themeRussian']) {
      expect(screen.queryByText(raw)).toBeNull();
    }
  });

  it('«Выйти» завершает сессию', () => {
    const { onLogout } = renderMenu({ auth: 'user' });

    fireEvent.click(screen.getByText('Выйти'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe('RightMenu — поведение панели (эталон common.js:529–562)', () => {
  it('панель закрыта по умолчанию, открывается и закрывается по триггеру', () => {
    const { container } = render(
      <I18nProvider>
        <RightMenu />
      </I18nProvider>
    );
    const trigger = container.querySelector('#balloo-menu-btn') as HTMLElement;
    const panel = container.querySelector('#balloo-right-menu') as HTMLElement;

    expect(panel.className).not.toContain('right-menu--open');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(panel.className).toContain('right-menu--open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(trigger);
    expect(panel.className).not.toContain('right-menu--open');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('закрывается по клику вне панели', () => {
    const { container } = render(
      <I18nProvider>
        <RightMenu />
      </I18nProvider>
    );
    const trigger = container.querySelector('#balloo-menu-btn') as HTMLElement;
    const panel = container.querySelector('#balloo-right-menu') as HTMLElement;

    fireEvent.click(trigger);
    expect(panel.className).toContain('right-menu--open');

    // mousedown вне host-узла (common.js:549–553 слушает именно mousedown)
    fireEvent.mouseDown(document.body);
    expect(panel.className).not.toContain('right-menu--open');
  });

  it('закрывается по Escape', () => {
    const { container } = render(
      <I18nProvider>
        <RightMenu />
      </I18nProvider>
    );
    const trigger = container.querySelector('#balloo-menu-btn') as HTMLElement;
    const panel = container.querySelector('#balloo-right-menu') as HTMLElement;

    fireEvent.click(trigger);
    expect(panel.className).toContain('right-menu--open');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panel.className).not.toContain('right-menu--open');
  });

  it('подменю языка и темы переключаются по клику (▾/▴)', () => {
    const { container } = renderMenu({ auth: 'user' });
    const items = container.querySelectorAll('.right-menu__item');
    const langItem = items[0] as HTMLElement;
    const themeItem = items[1] as HTMLElement;

    // Язык: закрыт → открыт → закрыт
    expect(langItem.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(langItem);
    expect(langItem.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(langItem);
    expect(langItem.getAttribute('aria-expanded')).toBe('false');

    // Тема: открытие языка сброшено, тема открывается независимо
    fireEvent.click(themeItem);
    expect(themeItem.getAttribute('aria-expanded')).toBe('true');
  });

  it('в подменю языка — все контрактные языки (20)', () => {
    const { container } = renderMenu({ auth: 'user' });
    const langItem = container.querySelectorAll('.right-menu__item')[0] as HTMLElement;
    fireEvent.click(langItem);

    const subitems = container.querySelectorAll('.right-menu__submenu--open .right-menu__subitem');
    expect(subitems.length).toBe(SUPPORTED_LANGUAGES.length);
    expect(subitems.length).toBe(20);
  });

  it('выбор языка кликом меняет локаль в сторе', () => {
    const { container } = renderMenu({ auth: 'user' });
    const langItem = container.querySelectorAll('.right-menu__item')[0] as HTMLElement;
    fireEvent.click(langItem);

    const subitems = container.querySelectorAll('.right-menu__submenu--open .right-menu__subitem');
    // Берём язык, отличный от текущего (ru), чтобы изменение было заметно.
    const target = Array.from(subitems).find((el) => el.textContent?.includes('English')) as HTMLElement;
    expect(target).toBeTruthy();
    fireEvent.click(target);

    expect(useUIStore.getState().language).toBe('en');
  });

  it('выбор темы кликом меняет тему в сторе', () => {
    const { container } = renderMenu({ auth: 'user' });
    const themeItem = container.querySelectorAll('.right-menu__item')[1] as HTMLElement;
    fireEvent.click(themeItem);

    const subitems = container.querySelectorAll('.right-menu__submenu--open .right-menu__subitem');
    const light = Array.from(subitems).find((el) => el.textContent?.includes('Светлая')) as HTMLElement;
    expect(light).toBeTruthy();
    fireEvent.click(light);

    expect(useUIStore.getState().theme).toBe('light');
  });

  it('триггер: гость — маскот, авторизованный — инициалы', () => {
    const guest = render(
      <I18nProvider>
        <RightMenu auth="guest" />
      </I18nProvider>
    );
    expect(guest.container.querySelector('.mascot')?.textContent).toBe('🐻');
    guest.unmount();

    const user = render(
      <I18nProvider>
        <RightMenu auth="user" userInitials="АБ" />
      </I18nProvider>
    );
    expect(user.container.querySelector('.mascot')).toBeNull();
    expect(user.container.querySelector('#balloo-menu-btn .avatar span')?.textContent).toBe('АБ');
  });
});
