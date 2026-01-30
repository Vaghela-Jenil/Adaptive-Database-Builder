import { motion } from "motion/react";
import {
  Palette,
  Bell,
  Shield,
  Save,
  Lock,
} from "lucide-react";
import { Card } from "../../ui/card";
import { Switch } from "../../ui/switch";
import { useState, ChangeEvent } from "react";

/* ================= TYPES ================= */

type ToggleSetting = {
  id: string;
  label: string;
  value: boolean;
};

type SecurityState = {
  password: string;
  sessionTimeout: number;
};

/* ================= COMPONENT ================= */

export default function Settings() {
  const [accentColor, setAccentColor] = useState<string>("#22d3ee");
  const [animationLevel, setAnimationLevel] = useState<number>(60);

  const [notifications, setNotifications] = useState<ToggleSetting[]>([
    { id: "email", label: "Email Notifications", value: true },
    { id: "push", label: "Push Notifications", value: true },
    { id: "weekly", label: "Weekly Summary", value: false },
  ]);

  const [security, setSecurity] = useState<SecurityState>({
    password: "",
    sessionTimeout: 30,
  });

  /* ================= HANDLERS ================= */

  const toggleNotification = (id: string): void => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value: !item.value } : item
      )
    );
  };

  const handleSave = (): void => {
    console.log({
      accentColor,
      animationLevel,
      notifications,
      security,
    });
  };

  /* ================= UI ================= */

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white"
          >
            Settings
          </motion.h1>
          <p className="text-slate-400 mt-1">
            Customize behavior, appearance and security
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white hover:opacity-90 transition"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* APPEARANCE */}
      <Card className="p-6 bg-slate-900/60 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Appearance</h2>
        </div>

        {/* COLOR PICKER */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-slate-300">Accent Color</span>
          <input
            type="color"
            value={accentColor}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAccentColor(e.target.value)
            }
            className="w-14 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>

        {/* SLIDER */}
        <div className="space-y-2">
          <span className="text-slate-300">
            Animation Intensity ({animationLevel}%)
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={animationLevel}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAnimationLevel(Number(e.target.value))
            }
            className="w-full accent-cyan-500"
          />
        </div>
      </Card>

      {/* NOTIFICATIONS */}
      <Card className="p-6 bg-slate-900/60 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50"
            >
              <span className="text-slate-300">{item.label}</span>
              <Switch
                checked={item.value}
                onCheckedChange={() => toggleNotification(item.id)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* SECURITY */}
      <Card className="p-6 bg-slate-900/60 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-rose-400" />
          <h2 className="text-xl font-semibold text-white">Security</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm">New Password</label>
            <input
              type="password"
              value={security.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSecurity({ ...security, password: e.target.value })
              }
              className="w-full mt-1 p-3 rounded-xl bg-slate-800 text-white outline-none border border-slate-700 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              value={security.sessionTimeout}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSecurity({
                  ...security,
                  sessionTimeout: Number(e.target.value),
                })
              }
              className="w-full mt-1 p-3 rounded-xl bg-slate-800 text-white outline-none border border-slate-700 focus:border-rose-500"
            />
          </div>
        </div>
      </Card>

      {/* DANGER ZONE */}
      <Card className="p-6 bg-rose-900/10 border border-rose-800/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
            <Lock className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-400">Danger Zone</h3>
            <p className="text-slate-400 text-sm mb-4">
              These actions are irreversible
            </p>
            <button className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition">
              Delete Account
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
