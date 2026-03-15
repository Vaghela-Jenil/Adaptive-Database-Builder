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
import { useContext, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import NavbarThemeSwitcher from "../NavbarThemeSwitcher";
import { UserButton } from "@clerk/nextjs";
import { UserContext } from "@/context/userContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NavBarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onRefresh: () => void;
};

export default function DashboardNavbar({ isSidebarOpen, setIsSidebarOpen, onRefresh }: NavBarProps) {
  const [notifications, setNotifications] = useState(3);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const { currentTheme } = useTheme();
  const { user } = useContext<any>(UserContext);

  const featureSummaries = [
    {
      title: "Dashboard",
      points: [
        "View key platform metrics and activity at a glance.",
        "Track overall usage and recent updates quickly.",
      ],
    },
    {
      title: "Databases",
      points: [
        "Create and manage custom databases.",
        "Open, edit, secure, and organize records with access control.",
      ],
    },
    {
      title: "Analytics",
      points: [
        "Build charts and compare data across datasets.",
        "Analyze trends and generate insights from records.",
      ],
    },
    {
      title: "AI Assistant",
      points: [
        "Ask questions about your data in natural language.",
        "Get guided help for workflows and data operations.",
      ],
    },
    {
      title: "Nearby Stores",
      points: [
        "Locate nearby stores using location-based search.",
        "Use map-based results to plan stock or purchasing actions.",
      ],
    },
    {
      title: "Share Folder",
      points: [
        "Share databases with team members securely.",
        "Assign role-based permissions for collaboration.",
      ],
    },
    {
      title: "Query",
      points: [
        "Raise support or functional queries from inside the app.",
        "Get help for usage, issues, and feature guidance.",
      ],
    },
    {
      title: "Chat",
      points: [
        "Communicate in direct and group conversations.",
        "Exchange messages and files with real-time updates.",
      ],
    },
  ];

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
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Help */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            onClick={() => setIsSummaryOpen(true)}
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

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent
          className="max-w-3xl max-h-[80vh] overflow-y-auto"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: currentTheme.text }}>
              System Feature Summary
            </DialogTitle>
            <DialogDescription style={{ color: currentTheme.textSecondary }}>
              Quick point-wise overview of all side panel features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {featureSummaries.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                  {feature.title}
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {feature.points.map((point) => (
                    <li key={point} className="text-sm" style={{ color: currentTheme.textSecondary }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.header>
  );
}