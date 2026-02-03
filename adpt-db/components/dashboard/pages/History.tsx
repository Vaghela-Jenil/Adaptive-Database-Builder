import { motion } from "motion/react";
import {
  Clock,
  Database,
  Edit,
  Trash2,
  Upload,
  Download,
  Share2,
  FileText,
  Filter,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function History() {
  const { currentTheme } = useTheme();

  const activities = [
    {
      id: 1,
      type: "create",
      action: "Created new database",
      target: "Customer Records",
      user: "John Doe",
      timestamp: new Date(Date.now() - 120000),
      icon: Database,
    },
    {
      id: 2,
      type: "edit",
      action: "Updated record",
      target: "Invoice #1234",
      user: "Sarah Chen",
      timestamp: new Date(Date.now() - 300000),
      icon: Edit,
    },
    {
      id: 3,
      type: "upload",
      action: "Uploaded file",
      target: "Q4_Report.pdf",
      user: "Mike Johnson",
      timestamp: new Date(Date.now() - 900000),
      icon: Upload,
    },
    {
      id: 4,
      type: "share",
      action: "Shared folder",
      target: "Financial Documents",
      user: "Emily Rodriguez",
      timestamp: new Date(Date.now() - 1800000),
      icon: Share2,
    },
    {
      id: 5,
      type: "delete",
      action: "Deleted record",
      target: "Old Project Data",
      user: "Alex Turner",
      timestamp: new Date(Date.now() - 3600000),
      icon: Trash2,
    },
    {
      id: 6,
      type: "download",
      action: "Downloaded export",
      target: "Database_Backup.zip",
      user: "John Doe",
      timestamp: new Date(Date.now() - 7200000),
      icon: Download,
    },
    {
      id: 7,
      type: "create",
      action: "Generated report",
      target: "Monthly Analytics",
      user: "Sarah Chen",
      timestamp: new Date(Date.now() - 86400000),
      icon: FileText,
    },
    {
      id: 8,
      type: "edit",
      action: "Modified permissions",
      target: "Team Workspace",
      user: "Mike Johnson",
      timestamp: new Date(Date.now() - 172800000),
      icon: Edit,
    },
  ];

  const getRelativeTime = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
            style={{ color: currentTheme.text }}
          >
            Activity History
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: currentTheme.textSecondary }}
          >
            Track all changes and activities across your databases
          </motion.p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Today", value: "24" },
          { label: "This Week", value: "156" },
          { label: "This Month", value: "892" },
          { label: "All Time", value: "12.4K" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-6 rounded-2xl text-center"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <p className="text-3xl font-bold mb-1" style={{ color: currentTheme.text }}>
              {stat.value}
            </p>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-6"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: currentTheme.text }}>
          Recent Activity
        </h2>

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-xl hover:scale-[1.01] transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium mb-1" style={{ color: currentTheme.text }}>
                        {activity.action}
                      </p>
                      <p className="text-sm mb-2" style={{ color: currentTheme.primary }}>
                        {activity.target}
                      </p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: currentTheme.textSecondary }}>
                        <span>{activity.user}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs whitespace-nowrap" style={{ color: currentTheme.textSecondary }}>
                      {activity.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center">
          <button
            className="px-6 py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Load More Activities
          </button>
        </div>
      </motion.div>
    </div>
  );
}
