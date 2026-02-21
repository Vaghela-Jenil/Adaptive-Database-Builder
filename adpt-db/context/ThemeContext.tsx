'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'neutral' | 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export type ThemeColors = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
};

export const themeDefs: Record<ThemeName, { light: ThemeColors; dark: ThemeColors }> = {
  neutral: {
    light: { primary: '#000000', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#ffffff', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  red: {
    light: { primary: '#ef4444', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#ef4444', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  blue: {
    light: { primary: '#3b82f6', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#3b82f6', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  green: {
    light: { primary: '#10b981', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#10b981', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  purple: {
    light: { primary: '#a855f7', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#a855f7', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  orange: {
    light: { primary: '#f97316', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#f97316', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  pink: {
    light: { primary: '#ec4899', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#ec4899', background: '#000000', surface: '#171717', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
};

type ThemeContextType = {
  colorTheme: ThemeName;
  mode: ThemeMode;
  currentTheme: ThemeColors;
  toggleMode: () => void;
  changeTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Defaults to Grayscale
  const [colorTheme, setColorTheme] = useState<ThemeName>('neutral');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme-name') as ThemeName;
    const savedMode = localStorage.getItem('app-theme-mode') as ThemeMode;
    if (savedTheme) setColorTheme(savedTheme);
    if (savedMode) setMode(savedMode);
  }, []);

  const currentTheme = themeDefs[colorTheme][mode];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    localStorage.setItem('app-theme-name', colorTheme);
    localStorage.setItem('app-theme-mode', mode);
  }, [currentTheme, colorTheme, mode]);

  return (
    <ThemeContext.Provider value={{
      colorTheme, mode, currentTheme,
      toggleMode: () => setMode(m => m === 'dark' ? 'light' : 'dark'),
      changeTheme: (t) => setColorTheme(t)
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};