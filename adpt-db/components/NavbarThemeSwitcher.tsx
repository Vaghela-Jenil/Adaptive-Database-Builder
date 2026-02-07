'use client';
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Calendar, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
export default function NavbarThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { colorTheme, mode, changeTheme } = useTheme();
  const panelRef = useRef(null);

  const themeOptions = [
    { name: "red", color: "#ef4444", label: "Red Light", mode: "light" },
    { name: "red", color: "#ef4444", label: "Red Dark", mode: "dark" },
    { name: "blue", color: "#3b82f6", label: "Blue Light", mode: "light" },
    { name: "blue", color: "#3b82f6", label: "Blue Dark", mode: "dark" },
    { name: "green", color: "#10b981", label: "Green Light", mode: "light" },
    { name: "green", color: "#10b981", label: "Green Dark", mode: "dark" },
    { name: "purple", color: "#a855f7", label: "Purple Light", mode: "light" },
    { name: "purple", color: "#a855f7", label: "Purple Dark", mode: "dark" },
    { name: "orange", color: "#f97316", label: "Orange Light", mode: "light" },
    { name: "orange", color: "#f97316", label: "Orange Dark", mode: "dark" },
    { name: "pink", color: "#ec4899", label: "Pink Light", mode: "light" },
    { name: "pink", color: "#ec4899", label: "Pink Dark", mode: "dark" },
  ];

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event : any) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Calendar Icon Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all relative"
        style={{
          backgroundColor: mode === "dark" ? "#171717" : "#f5f5f5",
          border: `1px solid ${mode === "dark" ? "#262626" : "#e5e5e5"}`,
        }}
      >
        <Calendar
          className="w-5 h-5"
          style={{
            color: themeOptions.find((t) => t.name === colorTheme)?.color,
          }}
        />
        
        {/* Active indicator dot */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: themeOptions.find((t) => t.name === colorTheme)?.color,
            borderColor: mode === "dark" ? "#000000" : "#ffffff",
          }}
        />
      </motion.button>

      {/* Theme Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{
              backgroundColor: mode === "dark" ? "#171717" : "#f5f5f5",
              border: `1px solid ${mode === "dark" ? "#262626" : "#e5e5e5"}`,
            }}
          >
            {/* Header */}
            <div
              className="p-4"
              style={{
                borderBottom: `1px solid ${mode === "dark" ? "#262626" : "#e5e5e5"}`,
              }}
            >
              <h3
                className="font-bold"
                style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}
              >
                Choose Theme
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: mode === "dark" ? "#a3a3a3" : "#525252" }}
              >
                Select your preferred color and mode
              </p>
            </div>

            {/* Theme Grid */}
            <div className="p-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {themeOptions.map((option, index) => {
                const isActive = colorTheme === option.name && mode === option.mode;

                return (
                  <motion.button
                    key={`${option.name}-${option.mode}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      changeTheme(option.name, option.mode);
                      setTimeout(() => setIsOpen(false), 200);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all relative"
                    style={{
                      backgroundColor: isActive
                        ? option.color
                        : mode === "dark"
                        ? "#000000"
                        : "#ffffff",
                      border: `2px solid ${
                        isActive ? option.color : mode === "dark" ? "#262626" : "#e5e5e5"
                      }`,
                    }}
                  >
                    {/* Color Circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: option.color,
                        border: `2px solid ${
                          isActive
                            ? "#ffffff"
                            : option.mode === "dark"
                            ? "#000000"
                            : "#ffffff"
                        }`,
                      }}
                    >
                      {isActive && <Check className="w-5 h-5 text-white" />}
                    </div>

                    {/* Label */}
                    <div className="flex-1 text-left">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: isActive
                            ? "#ffffff"
                            : mode === "dark"
                            ? "#ffffff"
                            : "#000000",
                        }}
                      >
                        {option.label}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color: isActive
                            ? "rgba(255,255,255,0.7)"
                            : mode === "dark"
                            ? "#a3a3a3"
                            : "#525252",
                        }}
                      >
                        {option.mode === "dark" ? "Dark Mode" : "Light Mode"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
