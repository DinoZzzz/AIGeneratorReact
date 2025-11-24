import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export type PrimaryColor = {
  name: string;
  value: string; // HSL value
  foreground: string; // HSL value for text on primary color
  class: string; // Tailwind class for preview
};

export const primaryColors: PrimaryColor[] = [
  { name: 'Blue', value: '221 83% 53%', foreground: '210 40% 98%', class: 'bg-blue-600' },
  { name: 'Green', value: '142 71% 45%', foreground: '210 40% 98%', class: 'bg-green-600' },
  { name: 'Red', value: '0 84% 60%', foreground: '210 40% 98%', class: 'bg-red-600' },
  { name: 'Orange', value: '24 95% 53%', foreground: '210 40% 98%', class: 'bg-orange-600' },
  { name: 'Purple', value: '262 83% 58%', foreground: '210 40% 98%', class: 'bg-purple-600' },
  { name: 'Pink', value: '330 81% 60%', foreground: '210 40% 98%', class: 'bg-pink-600' },
  { name: 'Yellow', value: '47 95% 58%', foreground: '222 47% 11%', class: 'bg-yellow-500' },
  { name: 'Cyan', value: '189 94% 43%', foreground: '210 40% 98%', class: 'bg-cyan-600' },
];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: 'dark' | 'light';
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  systemTheme: 'light',
  primaryColor: primaryColors[0],
  setPrimaryColor: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const primaryColorKey = 'vite-ui-primary-color';
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
    const stored = localStorage.getItem(primaryColorKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return primaryColors[0];
      }
    }
    return primaryColors[0];
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    // Add smooth transition for theme changes
    root.style.colorScheme = effectiveTheme;
  }, [theme, systemTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', primaryColor.value);
    root.style.setProperty('--primary-foreground', primaryColor.foreground);
  }, [primaryColor]);

  const value = {
    theme,
    systemTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    primaryColor,
    setPrimaryColor: (color: PrimaryColor) => {
      localStorage.setItem(primaryColorKey, JSON.stringify(color));
      setPrimaryColor(color);
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}
