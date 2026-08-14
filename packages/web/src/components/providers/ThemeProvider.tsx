// Theme Provider — переключение тем (dark / light / russian)
// Uses CSS data-theme attribute and CSS custom properties

import { createContext, useContext, useCallback } from 'react';
import { useUIStore, type Theme } from '@/store/uiStore';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  themes: ['dark', 'light', 'russian'],
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const themes: Theme[] = ['dark', 'light', 'russian'];

  const value = useCallback(
    () => ({ theme, setTheme, themes }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value()}>
      {children}
    </ThemeContext.Provider>
  );
}
