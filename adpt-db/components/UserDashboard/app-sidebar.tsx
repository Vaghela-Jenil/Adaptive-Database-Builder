"use client";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  FolderLock,
  ChevronRight,
  MapPinned,
  Folder,
  MessageSquareMore,
  Sparkles,
  LogOut,
  Settings,
  MessageCircle,
  History,
  Shield,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { logLogout } from "@/lib/activityLogger";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/userContext";
import Image from "next/image";
import logo from '../../public/logo.png'

export default function DashboardSidebar({ activePage, setActivePage, isSidebarOpen }: { activePage: string; setActivePage: (page: string) => void; isSidebarOpen: boolean; }) {
  const { currentTheme } = useTheme();
  const { user } = useContext<any>(UserContext);
  const { openUserProfile, signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openClerkSettings = () => {
    setIsSettingsMenuOpen(false);
    openUserProfile();
  };

  const openSettingsMenu = () => {
    if (settingsMenuTimeoutRef.current) {
      clearTimeout(settingsMenuTimeoutRef.current);
      settingsMenuTimeoutRef.current = null;
    }

    setIsSettingsMenuOpen(true);
  };

  const closeSettingsMenu = () => {
    if (settingsMenuTimeoutRef.current) {
      clearTimeout(settingsMenuTimeoutRef.current);
    }

    settingsMenuTimeoutRef.current = setTimeout(() => {
      setIsSettingsMenuOpen(false);
      settingsMenuTimeoutRef.current = null;
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    };
  }, []);

  const accountName = useMemo(() => {
    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return fullName || user?.userName || clerkUser?.fullName || clerkUser?.username || "Account";
  }, [clerkUser?.fullName, clerkUser?.username, user?.firstName, user?.lastName, user?.userName]);

  const accountImage = user?.userImage || clerkUser?.imageUrl || "";
  const accountInitials = accountName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "A";

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "database",
      label: "Databases",
      icon: Folder,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      id: "chatbot",
      label: "AI Assistant",
      icon: Sparkles,
    },
    {
      id: 'nearby-stores',
      label: 'Nearby Stores',
      icon: MapPinned,
    },
     {
      id: 'history',
      label: 'History',
      icon: History,
    }
  ];

  const secureItems = [
     {
      id: "share-folder",
      label: "Share Folder",
      icon: FolderLock,
    },
    {
      id: "query",
      label: "Query",
      icon: MessageSquareMore,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
    },
  ]

  const tourTargetIds: Record<string, string> = {
    dashboard: "onborda-dashboard-home",
    database: "onborda-database",
    analytics: "onborda-analytics",
    chatbot: "onborda-chatbot",
    "nearby-stores": "onborda-nearby-store",
    history: "onborda-history",
    "share-folder": "onborda-shared-database",
    query: "onborda-query",
    chat: "onborda-chat-app",
  };

  return (
  <div suppressHydrationWarning className="relative h-[100dvh]" // Ensure height is 100%
      style={{
        backgroundColor: currentTheme.surface,
        borderRight: `1px solid ${currentTheme.border}`,
      }}>
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="overflow-hidden shrink-0 h-full" // Ensure height is 100%
      >
        {/* Main Flex Container: h-screen or h-full depending on parent */}
        <div className="w-[280px] h-full min-h-0 flex flex-col">
          
          {/* 1. FIXED HEADER */}
          <div
            className="p-4 shrink-0" // shrink-0 prevents the header from collapsing
            style={{ borderBottom: `1px solid ${currentTheme.border}` }}
          >
            <motion.div
              className="flex items-center gap-3"
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div
                  className="absolute -inset-1 rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${currentTheme.primary}66, transparent 70%)`,
                  }}
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.96, 1.06, 0.96] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{
                    backgroundColor: `${currentTheme.primary}14`,
                    border: `1px solid ${currentTheme.primary}55`,
                    transformStyle: "preserve-3d",
                    perspective: 1000,
                  }}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
                >
                  <Image
                    src={logo}
                    alt="Sysnera Logo"
                    width={50}
                    height={50}
                    className="object-contain p-1"
                    priority
                  />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
              >
                <motion.h2
                  className="font-semibold"
                  style={{ color: currentTheme.text }}
                  animate={{ letterSpacing: ["0em", "0.02em", "0em"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  Sysnera
                </motion.h2>
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  Data Intelligence
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* 2. SCROLLABLE NAVIGATION AREA */}
          <nav 
          className="flex-1 min-h-0 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-lg transition-all"
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: `${currentTheme.primary}60 transparent`,
  }}
          
          >
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    id={tourTargetIds[item.id]}
                    onClick={() => setActivePage(item.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full min-h-11 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                    style={{
                      backgroundColor: isActive ? currentTheme.primary : "transparent",
                      color: isActive ? "#ffffff" : currentTheme.text,
                      border: `1px solid ${isActive ? currentTheme.primary : currentTheme.border}`,
                      boxShadow: isActive ? "0 6px 14px rgba(0, 0, 0, 0.18)" : "0 2px 8px rgba(0, 0, 0, 0.10)",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium leading-none whitespace-nowrap">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Access Section */}
            <div className="mt-6 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-2"
                 style={{ color: currentTheme.textSecondary }}>
                Quick Access
              </p>
              <div className="space-y-1">
                {secureItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      id={tourTargetIds[item.id]}
                      onClick={() => setActivePage(item.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full min-h-11 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                      style={{
                        backgroundColor: isActive ? currentTheme.primary : "transparent",
                        color: isActive ? "#ffffff" : currentTheme.text,
                        border: `1px solid ${isActive ? currentTheme.primary : currentTheme.border}`,
                        boxShadow: isActive ? "0 6px 14px rgba(0, 0, 0, 0.18)" : "0 2px 8px rgba(0, 0, 0, 0.10)",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium leading-none whitespace-nowrap">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* 3. FIXED BOTTOM SETTINGS */}
          <div
            className="w-full shrink-0 p-4" // shrink-0 ensures this stays visible
            style={{
              borderTop: `1px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.surface
            }}
          >
            <div
              className="relative p-3 rounded-xl"
              onMouseEnter={openSettingsMenu}
              onMouseLeave={closeSettingsMenu}
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              {/* Profile Button */}
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl text-left"
                onClick={openClerkSettings}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={{
                    backgroundColor: `${currentTheme.primary}18`,
                    color: currentTheme.primary,
                  }}
                >
                  {accountImage ? (
                    <img src={accountImage} alt={accountName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{accountInitials}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="w-full truncate text-sm font-medium" style={{ color: currentTheme.text }}>
                    {accountName}
                  </p>
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Hover for settings
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: currentTheme.textSecondary }} />
              </button>

              {/* Settings Dropup Menu */}
              {isSettingsMenuOpen && (
                <div
                  className="absolute inset-x-0 bottom-full z-20 pb-2"
                  onMouseEnter={openSettingsMenu}
                  onMouseLeave={closeSettingsMenu}
                >
                  <div
                    className="rounded-2xl p-2 shadow-2xl"
                    style={{
                      backgroundColor: currentTheme.surface,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                      style={{ color: currentTheme.text }}
                      onClick={openClerkSettings}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>

                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                        style={{ color: currentTheme.primary }}
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          router.push('/admin/dashboard');
                        }}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                      style={{ color: "#ef4444" }}
                      onClick={async () => {
                        setIsSettingsMenuOpen(false);
                        await logLogout();
                        await signOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}