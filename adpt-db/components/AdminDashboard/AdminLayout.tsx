'use client';
import { useState, useContext } from "react";
import { motion } from "motion/react";
import {
  Users,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  RefreshCcw,
  User,
} from "lucide-react";
import { useClerk, UserAvatar, UserButton } from '@clerk/clerk-react'
import { useTheme } from "@/context/ThemeContext";
import NavbarThemeSwitcher from "../NavbarThemeSwitcher";
import UserManagement from "./pages/UserManagement";
import EmailCenter from "./pages/EmailCenter";
import QueryManagement from "./pages/QueryManagement";
import { UserContext } from "@/context/userContext";
import Image from "next/image";
import logo from '../../public/logo.png'
import VisitTracker from "../VisitTracker";
import Link from "next/link";
import { logLogout } from "@/lib/activityLogger";

export default function AdminLayout() {
  const [activePage, setActivePage] = useState("users");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { currentTheme } = useTheme();
  const { signOut, session } = useClerk();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext<any>(UserContext);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsLoading(false);
    }, 500);
  };

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
      <VisitTracker />
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
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `${currentTheme.primary}10` }} // Subtle brand-colored background
                >
                  <Image
                    src={logo}
                    alt="Sysnera Logo"
                    width={40}
                    height={40}
                    className="object-contain p-1" // Ensures logo doesn't touch the edges
                    priority // Loads logo immediately for better LCP
                  />
                </div>
              </div>
              <div>
                <h1 className="font-bold" style={{ color: currentTheme.text }}>
                  Sysnera
                </h1>
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  Data Intelligence
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
                const isHovered = hoveredItem === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative"
                    style={{
                      backgroundColor: isActive
                        ? currentTheme.primary
                        : isHovered
                          ? `${currentTheme.primary}50`
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
            className="p-4 flex flex-col gap-1"
            style={{ borderTop: `1px solid ${currentTheme.border}` }}
          >
            <Link href="/user/dashboard" className="font-medium">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            >
              <User className="w-5 h-5" />
                User Dashboard            
            </button>
             </Link>
            <button
              onClick={async () => {
                await logLogout();
                await signOut();
              }}
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
                <PanelLeftClose className="w-5 h-5" style={{ color: currentTheme.text }} />
              ) : (
                <PanelLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
              )}
            </button>

            <button
              className="p-2 rounded-lg transition-all active:scale-90"
              onClick={handleRefresh}
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

            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              {menuItems.find((item) => item.id === activePage)?.label}
            </h2>
          </div>

          {/* User Profile & Theme Switcher */}
          <div className="flex items-center gap-3">
            <NavbarThemeSwitcher />
            <div className="text-right">
              <p className="font-medium" style={{ color: currentTheme.text }}>
                {user && user?.userName}
              </p>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }} title={user && user.email}>
                {user && user.email.substring(0, 10)}...
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
               <div
              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: `${currentTheme.primary}18`,
                color: currentTheme.primary,
              }}
            >
              {user?.userImage ? (
                <img src={user.userImage} alt={user?.userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">
                  {(user?.userName || "A")
                    .split(" ")
                    .slice(0, 2)
                    .map((n: string) => n[0]?.toUpperCase())
                    .join("")}
                </span>
              )}
            </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          key={refreshKey}
          className="flex-1 overflow-y-auto relative"
          style={{ backgroundColor: currentTheme.background }}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${currentTheme.primary} transparent transparent ${currentTheme.primary}` }}
              />
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>
    </div>
  );
}