import { motion } from "motion/react";
import { Palette, Moon, Sun, Bell, Lock, Database, Globe } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Switch } from "../../ui/switch";

export default function SettingsPanel() {
  const { currentTheme, colorTheme, mode, changeTheme, toggleMode } = useTheme();

  const colorThemes = [
    { name: "red", color: "#ef4444", label: "Red" },
    { name: "blue", color: "#3b82f6", label: "Blue" },
    { name: "green", color: "#10b981", label: "Green" },
    { name: "purple", color: "#a855f7", label: "Purple" },
    { name: "orange", color: "#f97316", label: "Orange" },
    { name: "pink", color: "#ec4899", label: "Pink" },
  ];

  const settingsSections = [
    {
      title: "Appearance",
      icon: Palette,
      settings: [
        {
          label: "Theme Mode",
          description: "Switch between light and dark mode",
          type: "custom",
          component: (
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeTheme(colorTheme, "light")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor:
                    mode === "light" ? currentTheme.primary : currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: mode === "light" ? "#ffffff" : currentTheme.text,
                }}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => changeTheme(colorTheme, "dark")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor:
                    mode === "dark" ? currentTheme.primary : currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: mode === "dark" ? "#ffffff" : currentTheme.text,
                }}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          ),
        },
        {
          label: "Accent Color",
          description: "Choose your preferred accent color",
          type: "custom",
          component: (
            <div className="grid grid-cols-6 gap-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => changeTheme(theme.name)}
                  className="w-12 h-12 rounded-xl transition-all hover:scale-110"
                  style={{
                    backgroundColor: theme.color,
                    border:
                      colorTheme === theme.name
                        ? `3px solid ${currentTheme.text}`
                        : "3px solid transparent",
                  }}
                  title={theme.label}
                />
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          label: "Email Notifications",
          description: "Receive email updates about system activity",
          type: "toggle",
          value: true,
        },
        {
          label: "Push Notifications",
          description: "Get browser notifications for important events",
          type: "toggle",
          value: true,
        },
        {
          label: "Query Alerts",
          description: "Notify when new user queries arrive",
          type: "toggle",
          value: true,
        },
        {
          label: "Weekly Reports",
          description: "Receive weekly summary reports",
          type: "toggle",
          value: false,
        },
      ],
    },
    {
      title: "Security",
      icon: Lock,
      settings: [
        {
          label: "Two-Factor Authentication",
          description: "Add an extra layer of security",
          type: "toggle",
          value: true,
        },
        {
          label: "Session Timeout",
          description: "Automatically log out after inactivity",
          type: "select",
          value: "30 minutes",
          options: ["15 minutes", "30 minutes", "1 hour", "2 hours"],
        },
        {
          label: "Login Alerts",
          description: "Get notified of new login attempts",
          type: "toggle",
          value: true,
        },
      ],
    },
    {
      title: "System",
      icon: Database,
      settings: [
        {
          label: "Auto-Save",
          description: "Automatically save changes",
          type: "toggle",
          value: true,
        },
        {
          label: "Data Retention",
          description: "How long to keep deleted items",
          type: "select",
          value: "30 days",
          options: ["7 days", "30 days", "90 days", "Forever"],
        },
        {
          label: "Backup Frequency",
          description: "How often to backup data",
          type: "select",
          value: "Daily",
          options: ["Hourly", "Daily", "Weekly"],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="rounded-xl p-6"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                {section.title}
              </h2>
            </div>

            {/* Settings Items */}
            <div className="space-y-4">
              {section.settings.map((setting, settingIndex) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium mb-1" style={{ color: currentTheme.text }}>
                      {setting.label}
                    </p>
                    <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                      {setting.description}
                    </p>
                  </div>

                  <div className="ml-4">
                    {setting.type === "toggle" && <Switch defaultChecked={setting.value} />}

                    {setting.type === "select" && (
                      <select
                        defaultValue={setting.value}
                        className="px-4 py-2 rounded-lg outline-none"
                        style={{
                          backgroundColor: currentTheme.surface,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text,
                        }}
                      >
                        {setting.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {setting.type === "custom" && setting.component}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl p-6"
        style={{
          backgroundColor: currentTheme.surface,
          border: `2px solid #ef4444`,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
            <p className="mb-4" style={{ color: currentTheme.textSecondary }}>
              Irreversible actions that affect your system
            </p>
            <div className="flex gap-3">
              <button
                className="px-6 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              >
                Reset All Settings
              </button>
              <button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all">
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
