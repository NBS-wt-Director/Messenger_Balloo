// Тесты сторов UI (тик. №1 мультитикета поддоменов):
// - тема/язык — @balloo/ui (единый контракт всех сайтов);
// - layout (sidebar/panels) — web-локальный store.
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore as useThemeLangStore } from '@balloo/ui';
import { useUIStore } from '../../store/uiStore';

describe('uiStore (@balloo/ui): theme + language', () => {
  beforeEach(() => {
    useThemeLangStore.setState({ theme: 'dark', language: 'ru' });
  });

  it('starts with default theme dark', () => {
    expect(useThemeLangStore.getState().theme).toBe('dark');
  });

  it('starts with default language ru', () => {
    expect(useThemeLangStore.getState().language).toBe('ru');
  });

  it('setTheme changes theme', () => {
    useThemeLangStore.getState().setTheme('light');
    expect(useThemeLangStore.getState().theme).toBe('light');
  });

  it('setTheme to russian works', () => {
    useThemeLangStore.getState().setTheme('russian');
    expect(useThemeLangStore.getState().theme).toBe('russian');
  });

  it('setLanguage changes language', () => {
    useThemeLangStore.getState().setLanguage('en');
    expect(useThemeLangStore.getState().language).toBe('en');
  });
});

describe('uiStore (web): layout', () => {
  beforeEach(() => {
    useUIStore.setState({
      isSidebarOpen: true,
      isRightPanelOpen: false,
      isSettingsOpen: false,
      isSearchOpen: false,
    });
  });

  it('starts with sidebar open', () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it('toggleSidebar toggles sidebar state', () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it('setSidebarOpen sets sidebar state directly', () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  it('toggleRightPanel toggles right panel state', () => {
    expect(useUIStore.getState().isRightPanelOpen).toBe(false);
    useUIStore.getState().toggleRightPanel();
    expect(useUIStore.getState().isRightPanelOpen).toBe(true);
  });

  it('setRightPanelOpen sets right panel state', () => {
    useUIStore.getState().setRightPanelOpen(true);
    expect(useUIStore.getState().isRightPanelOpen).toBe(true);
  });

  it('toggleSettings toggles settings state', () => {
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
    useUIStore.getState().toggleSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(true);
  });

  it('toggleSearch toggles search state', () => {
    expect(useUIStore.getState().isSearchOpen).toBe(false);
    useUIStore.getState().toggleSearch();
    expect(useUIStore.getState().isSearchOpen).toBe(true);
  });

  it('setSearchOpen sets search state', () => {
    useUIStore.getState().setSearchOpen(true);
    expect(useUIStore.getState().isSearchOpen).toBe(true);
  });
});
