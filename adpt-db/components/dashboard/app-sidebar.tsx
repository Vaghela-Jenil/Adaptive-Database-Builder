"use client";

import { motion } from "motion/react";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Clock,
  Settings,
  Database,
  FolderLock,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardSidebar({
  activePage,
  setActivePage,
}: {
  activePage: string;
  setActivePage: (id: string) => void;
}) {
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "chatbot", label: "AI Assistant", icon: MessageSquare },
    { id: "history", label: "History", icon: Clock },
  ];

  const bottomItems = [{ id: "settings", label: "Settings", icon: Settings }];

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-72 bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Database className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-white font-semibold">My Digital Records</h2>
            <p className="text-white/40 text-xs">Enterprise Edition</p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <motion.div key={item.id} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-white/5 border border-white/10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}

                <Button
                  variant="ghost"
                  onClick={() => setActivePage(item.id)}
                  className={`w-full justify-start gap-3 px-4 py-6 rounded-xl relative z-10
                    ${
                      isActive
                        ? "text-white"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto w-4 h-4 text-white/70" />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="mt-8">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-4 mb-3">
            Quick Access
          </p>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-white/5"
            >
              <Database className="w-4 h-4" />
              <span className="text-sm">My Databases</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-white/5"
            >
              <FolderLock className="w-4 h-4" />
              <span className="text-sm">Secure Folders</span>
            </Button>
          </div>
        </div>
      </nav>

      <Separator className="bg-white/10" />

      {/* Bottom */}
      <div className="p-4 space-y-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActivePage(item.id)}
              className={`w-full justify-start gap-3 py-6 rounded-xl
                ${
                  isActive
                    ? "bg-white/5 text-white border border-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}

        {/* User */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
          <Avatar>
            <AvatarFallback className="bg-white text-black font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              John Doe
            </p>
            <p className="text-white/40 text-xs truncate">
              john@company.com
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
