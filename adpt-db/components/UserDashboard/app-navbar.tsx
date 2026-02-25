import { motion } from "motion/react";
import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  RefreshCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { useContext, useState, useMemo, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import NavbarThemeSwitcher from "../NavbarThemeSwitcher";
import { UserButton } from "@clerk/nextjs";
import { UserContext } from "@/context/userContext";

type NavBarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onRefresh: () => void;
};

export default function DashboardNavbar({ isSidebarOpen, setIsSidebarOpen, onRefresh }: NavBarProps) {
  const [notifications, setNotifications] = useState(3);
  const { currentTheme } = useTheme();
  const { user } = useContext<any>(UserContext);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-20 flex items-center px-8"
      style={{
        backgroundColor: currentTheme.surface,
        borderBottom: `1px solid ${currentTheme.border}`,
      }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left - Menu Toggle & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" style={{ color: currentTheme.text }} />
            ) : (
              <PanelLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
            )}
          </button>

          <button
            className="p-2 rounded-lg transition-all active:scale-90"
            onClick={onRefresh}
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <RefreshCcw
              className="w-5 h-5 transition-transform active:rotate-180 duration-500"
              style={{ color: currentTheme.text }}
            />
          </button>

          <div className="relative max-w-md w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: currentTheme.textSecondary }}
            />
            <input
              type="text"
              placeholder="Search pages..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            />
          </div>

          <Button
            size="sm"
            className="text-white border-0"
            onClick={() => ('database')}
            style={{ backgroundColor: currentTheme.primary }}          >
            <Plus className="w-4 h-4 mr-2" />
            New Database
          </Button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Help */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.textSecondary,
            }}
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.textSecondary,
            }}
          >
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {notifications}
              </span>
            )}
          </motion.button>

          {/* Theme Switcher */}
          <NavbarThemeSwitcher />

          {/* Profile */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <UserButton />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium" style={{ color: currentTheme.text }}>
                {user && user?.userName}
              </p>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                {user && user.role}
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}