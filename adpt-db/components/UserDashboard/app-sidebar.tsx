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
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { UserContext } from "@/context/userContext";
import Image from "next/image";
import logo from '../../public/logo.png'

export default function DashboardSidebar({ activePage, setActivePage, isSidebarOpen }: { activePage: string; setActivePage: (page: string) => void; isSidebarOpen: boolean; }) {
  const { currentTheme } = useTheme();
  const { user } = useContext<any>(UserContext);
  const { openUserProfile, signOut } = useClerk();
  const { user: clerkUser } = useUser();
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
      icon: MessageSquare,
    },
  ]

  const tourTargetIds: Record<string, string> = {
    dashboard: "onborda-dashboard-home",
    database: "onborda-database",
    analytics: "onborda-analytics",
    chatbot: "onborda-chatbot",
    "nearby-stores": "onborda-nearby-store",
    "share-folder": "onborda-shared-database",
    query: "onborda-query",
    chat: "onborda-chat-app",
  };

  return (
    <div suppressHydrationWarning className="relative"
      style={{
        backgroundColor: currentTheme.surface,
        borderRight: `1px solid ${currentTheme.border}`,
      }}>
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="overflow-hidden shrink-0"
      >
        <div className="w-70 h-full flex flex-col">
          <div
            className="p-6"
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
                <h2 className="font-semibold" style={{ color: currentTheme.text }}>
                  Sysnera
                </h2>
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                 Data Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <div key={item.id}>
                    <motion.button
                      key={item.id}
                      id={tourTargetIds[item.id]}
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
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* Quick Access */}
            <div className="mt-8">
              <p
                className="text-xs font-semibold uppercase tracking-wider px-4 mb-3"
                style={{ color: currentTheme.textSecondary }}
              >
                Quick Access
              </p>
            <div className="space-y-1">
              {secureItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <div key={item.id}>
                    <motion.button
                      key={item.id}
                      id={tourTargetIds[item.id]}
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
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </motion.button>
                  </div>
                );
              })}
            </div>
            </div>
          </nav>

          {/* Bottom Items - Settings */}
          <div
            className="w-full absolute bottom-0 p-4"
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
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl text-left"
                onClick={openClerkSettings}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
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
                      title="Setting"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                      style={{ color: currentTheme.text }}
                      onClick={openClerkSettings}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      title="Logout"
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                      style={{ color: "#ef4444" }}
                      onClick={async () => {
                        setIsSettingsMenuOpen(false);
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