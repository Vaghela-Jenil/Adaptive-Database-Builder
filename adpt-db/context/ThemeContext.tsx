'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

/* --------------------------------------------------
   Types
-------------------------------------------------- */

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
};

export type ThemeName =
  | 'red'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink';

export type ThemeConfig = {
  name: ThemeName;
  light: ThemeColors;
  dark: ThemeColors;
};

type ThemeContextType = {
  colorTheme: ThemeName;
  mode: ThemeMode;
  currentTheme: ThemeColors;
  toggleMode: () => void;
  changeTheme: (theme: ThemeName, mode?: ThemeMode) => void;
};

/* --------------------------------------------------
   Theme Definitions
-------------------------------------------------- */

export const themes: Record<ThemeName, ThemeConfig> = {
  red: {
    name: 'red',
    light: {
      primary: '#ef4444',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#ef4444',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
  blue: {
    name: 'blue',
    light: {
      primary: '#3b82f6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#3b82f6',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
  green: {
    name: 'green',
    light: {
      primary: '#10b981',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#10b981',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
  purple: {
    name: 'purple',
    light: {
      primary: '#a855f7',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#a855f7',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
  orange: {
    name: 'orange',
    light: {
      primary: '#f97316',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#f97316',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
  pink: {
    name: 'pink',
    light: {
      primary: '#ec4899',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    dark: {
      primary: '#ec4899',
      background: '#000000',
      surface: '#171717',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
  },
};

/* --------------------------------------------------
   Context
-------------------------------------------------- */

const ThemeContext = createContext<ThemeContextType | null>(null);

/* --------------------------------------------------
   Provider
-------------------------------------------------- */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ThemeName>('blue');
  const [mode, setMode] = useState<ThemeMode>('dark');

  const currentTheme = themes[colorTheme][mode];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [currentTheme]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeTheme = (theme: ThemeName, newMode?: ThemeMode) => {
    setColorTheme(theme);
    if (newMode) {
      setMode(newMode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        mode,
        currentTheme,
        toggleMode,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* --------------------------------------------------
   Hook
-------------------------------------------------- */

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
