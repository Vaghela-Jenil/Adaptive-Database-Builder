import { motion } from "motion/react";
import {
  User,
  Bell,
  Shield,
  Database,
  Globe,
  Key,
  Palette,
  Zap,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Switch } from "../../ui/switch";

export default function Settings() {
  const { currentTheme, colorTheme, mode, changeTheme } = useTheme();

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
      title: "Profile",
      icon: User,
      settings: [
        { label: "Full Name", type: "input", value: "John Doe" },
        { label: "Email", type: "input", value: "john@company.com" },
        { label: "Role", type: "select", value: "Administrator", options: ["Administrator", "Editor", "Viewer"] },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        { label: "Email Notifications", type: "toggle", value: true },
        { label: "Push Notifications", type: "toggle", value: true },
        { label: "Database Alerts", type: "toggle", value: false },
        { label: "Weekly Reports", type: "toggle", value: true },
      ],
    },
    {
      title: "Appearance",
      icon: Palette,
      settings: [
        {
          label: "Theme Mode",
          type: "custom",
          component: (
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeTheme(colorTheme, "light")}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: mode === "light" ? currentTheme.primary : currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: mode === "light" ? "#ffffff" : currentTheme.text,
                }}
              >
                Light
              </button>
              <button
                onClick={() => changeTheme(colorTheme, "dark")}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: mode === "dark" ? currentTheme.primary : currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: mode === "dark" ? "#ffffff" : currentTheme.text,
                }}
              >
                Dark
              </button>
            </div>
          ),
        },
        {
          label: "Accent Color",
          type: "custom",
          component: (
            <div className="flex items-center gap-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => changeTheme(theme.name)}
                  className="w-10 h-10 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: theme.color,
                    border: colorTheme === theme.name ? `3px solid ${currentTheme.text}` : "3px solid transparent",
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
      title: "Security",
      icon: Shield,
      settings: [
        { label: "Two-Factor Authentication", type: "toggle", value: true },
        { label: "Session Timeout", type: "select", value: "30 minutes", options: ["15 minutes", "30 minutes", "1 hour", "2 hours"] },
        { label: "Login Alerts", type: "toggle", value: true },
      ],
    },
    {
      title: "Database",
      icon: Database,
      settings: [
        { label: "Auto-Save", type: "toggle", value: true },
        { label: "Backup Frequency", type: "select", value: "Daily", options: ["Hourly", "Daily", "Weekly"] },
        { label: "Data Retention", type: "select", value: "90 days", options: ["30 days", "90 days", "1 year", "Forever"] },
      ],
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2"
          style={{ color: currentTheme.text }}
        >
          Settings
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: currentTheme.textSecondary }}
        >
          Manage your account and preferences
        </motion.p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
              className="rounded-2xl p-6"
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
                {section.settings.map((setting) => (
                  <div
                    key={setting.label}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      backgroundColor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: currentTheme.text }}>
                        {setting.label}
                      </p>
                    </div>

                    <div className="ml-4">
                      {setting.type === "toggle" && <Switch defaultChecked={setting.value} />}

                      {setting.type === "input" && (
                        <input
                          type="text"
                          defaultValue={setting.value}
                          className="px-4 py-2 rounded-lg outline-none"
                          style={{
                            backgroundColor: currentTheme.surface,
                            border: `1px solid ${currentTheme.border}`,
                            color: currentTheme.text,
                          }}
                        />
                      )}

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
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          className="px-6 py-3 rounded-xl font-medium transition-all"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          Reset
        </button>
        <button
          className="px-6 py-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: currentTheme.primary }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
