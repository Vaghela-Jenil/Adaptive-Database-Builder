'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Check, Moon, Sun } from "lucide-react";
import { useTheme, themeDefs, ThemeName } from "@/context/ThemeContext";

export default function NavbarThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { colorTheme, mode, changeTheme, toggleMode, currentTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Blue is now the default, but still available in the list to switch back to
  const colors: ThemeName[] = ['blue', 'red', 'green', 'purple', 'orange', 'pink'];

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all"
        style={{ 
          backgroundColor: currentTheme.surface, 
          borderColor: currentTheme.border 
        }}
      >
        <Palette className="w-5 h-5" style={{ color: currentTheme.primary }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute right-0 mt-3 p-2 rounded-full shadow-2xl z-50 border flex items-center gap-2"
            style={{ 
              backgroundColor: currentTheme.surface, 
              borderColor: currentTheme.border,
              backdropFilter: 'blur(12px)'
            }}
          >
            {/* 1. DARK/LIGHT TOGGLE */}
            <button
              onClick={toggleMode}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border shadow-sm"
              style={{ 
                backgroundColor: currentTheme.text, 
                borderColor: currentTheme.border 
              }}
            >
              {mode === 'light' ? (
                <Moon className="w-4 h-4" style={{ color: currentTheme.background }} />
              ) : (
                <Sun className="w-4 h-4" style={{ color: currentTheme.background }} />
              )}
            </button>

            <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

            {/* 2. COLOR CIRCLES */}
            <div className="flex gap-2 pr-1">
              {colors.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    changeTheme(name);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative"
                  style={{ backgroundColor: themeDefs[name].light.primary }}
                >
                  {colorTheme === name && (
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}