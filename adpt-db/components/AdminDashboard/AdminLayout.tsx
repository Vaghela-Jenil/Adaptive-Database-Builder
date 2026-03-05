'use client';
import { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useClerk, UserAvatar } from '@clerk/clerk-react'
import { useTheme } from "@/context/ThemeContext";
import NavbarThemeSwitcher from "../NavbarThemeSwitcher";
import UserManagement from "./pages/UserManagement";
import EmailCenter from "./pages/EmailCenter";
import QueryManagement from "./pages/QueryManagement";

export default function AdminLayout() {
  const [activePage, setActivePage] = useState("users");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentTheme } = useTheme();
  const { signOut, session } = useClerk()

  const menuItems = [
    { id: "users", label: "User Management", icon: Users },
    { id: "email", label: "Email Center", icon: Mail },
    { id: "queries", label: "Query Management", icon: MessageSquare },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "users":
        return <UserManagement />;
      case "email":
        return <EmailCenter />;
      case "queries":
        return <QueryManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="overflow-hidden shrink-0"
        style={{
          backgroundColor: currentTheme.surface,
          borderRight: `1px solid ${currentTheme.border}`,
        }}
      >
        <div className="w-70 h-full flex flex-col">
          {/* Logo */}
          <div
            className="h-20 flex items-center px-6"
            style={{ borderBottom: `1px solid ${currentTheme.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-bold" style={{ color: currentTheme.text }}>
                  Admin Panel
                </h1>
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  Control Center
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative"
                    style={{
                      backgroundColor: isActive
                        ? currentTheme.primary
                        : "transparent",
                      color: isActive ? "#ffffff" : currentTheme.text,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div
            className="p-4"
            style={{ borderTop: `1px solid ${currentTheme.border}` }}
          >
            <button
            onClick={async () => await signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-20 flex items-center justify-between px-8"
          style={{ borderBottom: `1px solid ${currentTheme.border}` }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" style={{ color: currentTheme.text }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: currentTheme.text }} />
              )}
            </button>
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              {menuItems.find((item) => item.id === activePage)?.label}
            </h2>
          </div>

          {/* User Profile & Theme Switcher */}
          <div className="flex items-center gap-3">
            <NavbarThemeSwitcher />
            <div className="text-right">
              <p className="font-medium" style={{ color: currentTheme.text }}>
                Vaghela Jenil
              </p>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                jenilvaghela9008@gmail.com
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              // style={{ backgroundColor: currentTheme.primary }}
            >
              <UserAvatar/>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-8"
          style={{ backgroundColor: currentTheme.background }}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  );
}