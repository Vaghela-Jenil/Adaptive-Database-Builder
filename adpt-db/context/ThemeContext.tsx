'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export type ThemeColors = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
};

export const themeDefs: Record<ThemeName, { light: ThemeColors; dark: ThemeColors }> = {
  blue: {
    light: { primary: '#3b82f6', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#3b82f6', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  red: {
    light: { primary: '#ef4444', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#ef4444', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  green: {
    light: { primary: '#10b981', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#10b981', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  purple: {
    light: { primary: '#a855f7', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#a855f7', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  orange: {
    light: { primary: '#f97316', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#f97316', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
  pink: {
    light: { primary: '#ec4899', background: '#ffffff', surface: '#f5f5f5', text: '#000000', textSecondary: '#525252', border: '#e5e5e5' },
    dark: { primary: '#ec4899', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#a3a3a3', border: '#262626' },
  },
};

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SET DEFAULT TO BLUE
  const [colorTheme, setColorTheme] = useState<ThemeName>('blue');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color') as ThemeName;
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedColor) setColorTheme(savedColor);
    if (savedMode) setMode(savedMode);
  }, []);

  const currentTheme = themeDefs[colorTheme][mode];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    localStorage.setItem('theme-color', colorTheme);
    localStorage.setItem('theme-mode', mode);
  }, [currentTheme, colorTheme, mode]);

  return (
    <ThemeContext.Provider value={{ colorTheme, mode, toggleMode: () => setMode(m => m === 'light' ? 'dark' : 'light'), changeTheme: setColorTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);