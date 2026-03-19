import { motion } from "motion/react";
import {
  Calendar,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  RefreshCcw,
  MessageCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { useContext, useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import NavbarThemeSwitcher from "../NavbarThemeSwitcher";
import { UserContext } from "@/context/userContext";
import TaskManager from "../TaskManager/TaskManager";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnborda } from "onborda";
import { dashboardTourName } from "./dashboard-tour-steps";

type NavBarProps = {
  onChangePage: (changePage: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onRefresh: () => void;
};

export default function DashboardNavbar({ isSidebarOpen, setIsSidebarOpen, onRefresh, onChangePage }: NavBarProps) {
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [taskCountForToday, setTaskCountForToday] = useState(0);
  const [loadingTaskCount, setLoadingTaskCount] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loadingMessageCount, setLoadingMessageCount] = useState(false);
  const { currentTheme } = useTheme();
  const { user } = useContext<any>(UserContext);
  const { startOnborda } = useOnborda();

  const handleStartTour = () => {
    setIsSidebarOpen(true);
    setIsSummaryOpen(false);

    window.setTimeout(() => {
      startOnborda(dashboardTourName);
    }, 180);
  };

  const fetchTodayTaskCount = async () => {
    if (!user) return;
    setLoadingTaskCount(true);
    try {
      const response = await axios.get("/api/tasks");
      const data = response.data;
      const today = new Date().toISOString().split("T")[0];
      const todayTasks = data.taskLists.flatMap((list: any) => 
        list.tasks.filter((task: any) => task.dueDate === today && !task.completed)
      );
      setTaskCountForToday(todayTasks.length);
    } catch (error) {
      console.error("Failed to fetch task count:", error);
    } finally {
      setLoadingTaskCount(false);
    }
  };

  const fetchUnreadMessageCount = async () => {
    if (!user) return;
    setLoadingMessageCount(true);
    try {
      // Fetch conversations with unread count
      const conversationsResponse = await axios.get("/api/chat/conversations").catch(() => ({ data: [] }));
      const conversations = conversationsResponse.data || [];
      const conversationUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);

      // Fetch groups with unread count
      const groupsResponse = await axios.get("/api/chat/groups").catch(() => ({ data: [] }));
      const groups = groupsResponse.data || [];
      const groupUnread = groups.reduce((sum: number, group: any) => sum + (group.unreadCount || 0), 0);

      const total = conversationUnread + groupUnread;
      setUnreadMessageCount(total);
    } catch (error) {
      console.error("Failed to fetch unread message count:", error);
    } finally {
      setLoadingMessageCount(false);
    }
  };

  // Fetch task count on component mount
  useEffect(() => {
    fetchTodayTaskCount();
  }, [user]);

  // Fetch task count when task manager opens/closes
  useEffect(() => {
    if (isTaskManagerOpen) {
      fetchTodayTaskCount();
    }
  }, [isTaskManagerOpen, user]);

  // Fetch unread message count on component mount
  useEffect(() => {
    fetchUnreadMessageCount();
    // Refetch every 5 seconds to keep it updated
    const refreshInterval = setInterval(fetchUnreadMessageCount, 5000);
    return () => clearInterval(refreshInterval);
  }, [user]);

  const handleTaskManagerClose = () => {
    setIsTaskManagerOpen(false);
    fetchTodayTaskCount();
  };


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
            id="onborda-navbar-info"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.textSecondary,
            }}
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>

          {/* Messages */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChangePage("chat")}
            id="onborda-navbar-chat"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.textSecondary,
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMessageCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  backgroundColor: currentTheme.primary,
                }}
              >
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            )}
          </motion.button>

          {/* Calendar / Task Manager */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTaskManagerOpen(true)}
            id="onborda-navbar-task-manager"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.textSecondary,
            }}
          >
            <Calendar className="w-5 h-5" />
            {taskCountForToday > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  backgroundColor: currentTheme.primary,
                }}
              >
                {taskCountForToday > 99 ? "99+" : taskCountForToday}
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
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium" style={{ color: currentTheme.text }}>
                {user?.userName}
              </p>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                {user?.role}
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

          <div
            className="rounded-2xl border p-4"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.surface}E6 0%, ${currentTheme.background}CC 100%)`,
              borderColor: currentTheme.border,
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: currentTheme.text }}>
                  Guided onboarding tour
                </p>
                <p className="mt-1 text-sm" style={{ color: currentTheme.textSecondary }}>
                  Walk through dashboard modules, shared tools, and the navbar actions with the new Onborda tour.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleStartTour}
                className="shrink-0 rounded-xl text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Start tour
              </Button>
            </div>
          </div>

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

      <TaskManager isOpen={isTaskManagerOpen} onClose={handleTaskManagerClose} onTasksUpdate={fetchTodayTaskCount} />
    </motion.header>
  );
}