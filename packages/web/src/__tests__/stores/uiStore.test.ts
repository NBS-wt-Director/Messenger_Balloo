import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../store/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: 'dark',
      language: 'ru',
      isSidebarOpen: true,
      isRightPanelOpen: false,
      isSettingsOpen: false,
      isSearchOpen: false,
    });
  });

  it('starts with default theme dark', () => {
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('starts with default language ru', () => {
    expect(useUIStore.getState().language).toBe('ru');
  });

  it('starts with sidebar open', () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it('setTheme changes theme', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('setTheme to russian works', () => {
    useUIStore.getState().setTheme('russian');
    expect(useUIStore.getState().theme).toBe('russian');
  });

  it('setLanguage changes language', () => {
    useUIStore.getState().setLanguage('en');
    expect(useUIStore.getState().language).toBe('en');
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
