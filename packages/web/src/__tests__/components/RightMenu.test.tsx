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
import { I18nProvider, RightMenu, useUIStore } from '@balloo/ui';

/** Подписки пунктов авторизованного + ярлык самой секции (settings.account). */
const ACCOUNT_LABELS = ['Профиль', 'Настройки', 'Аккаунты', 'Аккаунт'];
const RAW_KEYS = ['menu.profile', 'menu.settings', 'menu.accounts'];

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
    for (const label of ['Профиль', 'Настройки', 'Аккаунты']) {
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
