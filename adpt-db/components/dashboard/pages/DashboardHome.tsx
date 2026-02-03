import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Database,
  FolderLock,
  Activity,
  ArrowUpRight,
  Clock,
  Star,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function DashboardHome() {
  const { currentTheme } = useTheme();

  const stats = [
    {
      label: "Total Records",
      value: "12,458",
      change: "+12.5%",
      trend: "up",
      icon: Database,
    },
    {
      label: "Active Databases",
      value: "24",
      change: "+3",
      trend: "up",
      icon: FolderLock,
    },
    {
      label: "Team Members",
      value: "48",
      change: "+8",
      trend: "up",
      icon: Users,
    },
    {
      label: "API Calls",
      value: "1.2M",
      change: "+23.1%",
      trend: "up",
      icon: Activity,
    },
  ];

  const recentActivities = [
    {
      action: "New database created",
      database: "Customer Records",
      time: "2 minutes ago",
      user: "Sarah Chen",
    },
    {
      action: "Record updated",
      database: "Inventory System",
      time: "15 minutes ago",
      user: "Mike Johnson",
    },
    {
      action: "Folder shared",
      database: "Financial Reports",
      time: "1 hour ago",
      user: "Emily Rodriguez",
    },
    {
      action: "API key generated",
      database: "Analytics Dashboard",
      time: "3 hours ago",
      user: "Alex Turner",
    },
  ];

  const quickActions = [
    { label: "Create Database", icon: Database },
    { label: "New Folder", icon: FolderLock },
    { label: "Import Data", icon: ArrowUpRight },
    { label: "View Analytics", icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2"
          style={{ color: currentTheme.text }}
        >
          Welcome back, John 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: currentTheme.textSecondary }}
        >
          Here's what's happening with your records today
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.primary,
                  }}
                >
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <p className="text-sm mb-1" style={{ color: currentTheme.textSecondary }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: currentTheme.text }}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-6"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: currentTheme.text }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-sm" style={{ color: currentTheme.text }}>
                  {action.label}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            Recent Activity
          </h2>
          <button
            className="text-sm font-medium"
            style={{ color: currentTheme.primary }}
          >
            View All
          </button>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1" style={{ color: currentTheme.text }}>
                  {activity.action}
                </p>
                <p className="text-sm mb-1" style={{ color: currentTheme.textSecondary }}>
                  {activity.database}
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: currentTheme.textSecondary }}>
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
