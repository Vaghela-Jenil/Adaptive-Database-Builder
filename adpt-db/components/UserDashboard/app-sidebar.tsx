"use client";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Database,
  FolderLock,
  ChevronRight,
  MapPinned,
  Folder,
  MessageSquareMore,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { UserButton } from "@clerk/nextjs";
import { useContext } from "react";
import { UserContext } from "@/context/userContext";
import Image from "next/image";
import logo from '../../public/logo.png'

export default function DashboardSidebar({ activePage, setActivePage, isSidebarOpen }: { activePage: string; setActivePage: (page: string) => void; isSidebarOpen: boolean; }) {
  const { currentTheme } = useTheme();
  const { user } = useContext(UserContext);

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
      icon: MessageSquare,
    },
    {
      id: 'nearby-stores',
      label: 'Nearby Stores',
      icon: MapPinned,
    }
  ];

  const secureItems = [
     {
      id: "shared-folder",
      label: "Shared Folder",
      icon: FolderLock,
    },
    {
      id: "chats-app",
      label: "Chats",
      icon: MessageSquareMore,
    },
  ]


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
            title="Setting"
            style={{
              borderTop: `1px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.surface
            }}
          >
            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <UserButton />
                <p className="w-full text-sm font-medium truncate" style={{ color: currentTheme.text }}>
                  Settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}