/**
 * Правые меню шапки — их РОВНО ДВА (решение владельца 22.11.2026):
 *   • ОБЩЕЕ  RightMenu         — триггер-маскот, общие пункты (язык/тема/юр.),
 *                                авторизован → «Выйти», гость → «Вход»/«Регистрация»;
 *   • ЧАСТНОЕ PrivateRightMenu — триггер-аватарка (нет — логотип компании),
 *                                частные пункты приложения.
 *
 * Причина исходного тикета (P38): в проде меню показывало сырые ключи
 * «menu.profile», «menu.settings», «menu.accounts» — этих ключей в словаре не
 * было, а t() при отсутствии перевода возвращает сам ключ
 * (packages/shared/src/i18n/translations.ts, функция t). Ни сборка, ни CI не
 * шумели: RightMenuItem.key был объявлен `TranslationKey | string`, а
 * scripts/check-i18n.cjs видел только литералы t('…') и не смотрел на ключи,
 * переданные через props.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  I18nProvider,
  RightMenu,
  PrivateRightMenu,
  SUPPORTED_LANGUAGES,
  useUIStore,
} from '@balloo/ui';

/** Частные пункты приложения + ярлык секции «Аккаунт» в общем меню. */
const PRIVATE_LABELS = ['Профиль', 'Контакты', 'Истории', 'Приглашения', 'Настройки', 'Аккаунты'];
const PRIVATE_RAW_KEYS = [
  'menu.profile',
  'menu.contacts',
  'menu.stories',
  'menu.invites',
  'menu.settings',
  'menu.accounts',
];

/** Общее меню: рендер + открытие панели (по умолчанию она закрыта и aria-hidden). */
function renderCommon(props = {}) {
  const onNavigate = vi.fn();
  const onLogout = vi.fn();
  const view = render(
    <I18nProvider>
      <RightMenu onNavigate={onNavigate} onLogout={onLogout} {...props} />
    </I18nProvider>
  );
  fireEvent.click(view.container.querySelector('#balloo-menu-btn') as HTMLElement);
  return { onNavigate, onLogout, ...view };
}

/** Частное меню: рендер + открытие панели. */
function renderPrivate(props = {}) {
  const onNavigate = vi.fn();
  const view = render(
    <I18nProvider>
      <PrivateRightMenu onNavigate={onNavigate} {...props} />
    </I18nProvider>
  );
  fireEvent.click(view.container.querySelector('#balloo-private-menu-btn') as HTMLElement);
  return { onNavigate, ...view };
}

beforeEach(() => {
  cleanup();
  // В jsdom navigator отдаёт en-US, поэтому русскую локаль задаём явно.
  useUIStore.getState().setLanguage('ru');
});

describe('RightMenu (общее) — состав панели', () => {
  it('гость: «Вход» и «Регистрация», частных пунктов нет', () => {
    const { onNavigate, container } = renderCommon({ auth: 'guest' });

    // Кнопки содержат иконку, поэтому имя ищется по подстроке.
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    expect(onNavigate).toHaveBeenLastCalledWith('/login');

    // Переход закрывает меню (go() → setOpen(false)) — открываем заново.
    fireEvent.click(container.querySelector('#balloo-menu-btn') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /Регистрация/ }));
    expect(onNavigate).toHaveBeenLastCalledWith('/register');

    // Ярлык секции общий, а вот частных пунктов приложения у гостя быть не должно.
    expect(screen.getAllByText('Аккаунт').length).toBeGreaterThan(0);
    for (const label of PRIVATE_LABELS) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it('авторизован: «Выйти» завершает сессию, частных пунктов нет', () => {
    const { onLogout } = renderCommon({ auth: 'user' });

    fireEvent.click(screen.getByText('Выйти'));
    expect(onLogout).toHaveBeenCalledTimes(1);

    for (const label of PRIVATE_LABELS) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it('темы подписаны переводом, а не ключами menu.theme*', () => {
    renderCommon({ auth: 'user' });

    // Подпункт темы — «🌙 Тёмная» одним текстом, поэтому поиск по подстроке.
    for (const label of ['Тёмная', 'Светлая', 'Наша']) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
    }
    for (const raw of ['menu.themeDark', 'menu.themeLight', 'menu.themeRussian']) {
      expect(screen.queryByText(raw)).toBeNull();
    }
  });

  it('в подменю языка — все контрактные языки (20)', () => {
    const { container } = renderCommon({ auth: 'user' });
    const langItem = container.querySelectorAll('.right-menu__item')[0] as HTMLElement;
    fireEvent.click(langItem);

    const subitems = container.querySelectorAll('.right-menu__submenu--open .right-menu__subitem');
    expect(subitems.length).toBe(SUPPORTED_LANGUAGES.length);
    expect(subitems.length).toBe(20);
  });

  it('выбор языка кликом меняет локаль в сторе', () => {
    const { container } = renderCommon({ auth: 'user' });
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
    const { container } = renderCommon({ auth: 'user' });
    const themeItem = container.querySelectorAll('.right-menu__item')[1] as HTMLElement;
    fireEvent.click(themeItem);

    const subitems = container.querySelectorAll('.right-menu__submenu--open .right-menu__subitem');
    const light = Array.from(subitems).find((el) => el.textContent?.includes('Светлая')) as HTMLElement;
    expect(light).toBeTruthy();
    fireEvent.click(light);

    expect(useUIStore.getState().theme).toBe('light');
  });
});

describe('RightMenu (общее) — триггер всегда маскот', () => {
  it('гость и авторизованный — оба показывают маскот, аватарки нет', () => {
    const guest = render(
      <I18nProvider>
        <RightMenu auth="guest" />
      </I18nProvider>
    );
    expect(guest.container.querySelector('.mascot')).not.toBeNull();
    expect(guest.container.querySelector('.mascot') as HTMLElement).toHaveAttribute(
      'src',
      '/assets/logos/mascot.png'
    );
    guest.unmount();

    const user = render(
      <I18nProvider>
        <RightMenu auth="user" />
      </I18nProvider>
    );
    expect(user.container.querySelector('.mascot')).not.toBeNull();
    expect(user.container.querySelector('.avatar')).toBeNull();
  });
});

describe('RightMenu (общее) — поведение панели (эталон common.js:529–562)', () => {
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
    const { container } = renderCommon({ auth: 'user' });
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
});

describe('PrivateRightMenu (частное) — пункты приложения', () => {
  it('подписи переводом, сырых ключей нет', () => {
    renderPrivate();

    for (const label of PRIVATE_LABELS) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    for (const raw of PRIVATE_RAW_KEYS) {
      expect(screen.queryByText(raw)).toBeNull();
    }
  });

  it('клик по пункту ведёт на его маршрут', () => {
    const { onNavigate } = renderPrivate();

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

  it('триггер: аватарка пользователя, нет — логотип компании', () => {
    const noAvatar = render(
      <I18nProvider>
        <PrivateRightMenu initials="АБ" />
      </I18nProvider>
    );
    expect(
      noAvatar.container.querySelector('#balloo-private-menu-btn .avatar img') as HTMLElement
    ).toHaveAttribute('src', '/assets/logos/company-logo.png');
    noAvatar.unmount();

    const withAvatar = render(
      <I18nProvider>
        <PrivateRightMenu initials="АБ" avatarUrl="https://cdn.balloo.su/a.png" />
      </I18nProvider>
    );
    expect(
      withAvatar.container.querySelector('#balloo-private-menu-btn .avatar img') as HTMLElement
    ).toHaveAttribute('src', 'https://cdn.balloo.su/a.png');
  });
});
