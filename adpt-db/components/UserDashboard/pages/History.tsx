"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import {
  Search,
  Database,
  Edit,
  Trash2,
  Lock,
  Share2,
  MessageSquare,
  LogIn,
  LogOut,
  Unlink,
  FolderOpen,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from "lucide-react";

interface ActivityLog {
  id: string;
  type: "create" | "update" | "delete" | "password" | "share" | "query" | "login" | "logout" | "schema" | "open" | "remove_connection" | "request_accepted" | "access_granted" | "access_updated" | "friend_removed";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
}

// Fetch real activity data from API
const fetchActivities = async (): Promise<ActivityLog[]> => {
  try {
    const res = await axios.get("/api/activity?limit=500");
    const data = res.data;
    console.debug("Activities fetched:", data.activities?.length || 0, "activities");
    
    return (data.activities || []).map((activity: any) => ({
      id: activity._id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: new Date(activity.timestamp),
      icon: getActivityIcon(activity.type),
    }));
  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data || {};
    console.error("Failed to fetch activities:", status, errorData);
    return [];
  }
};

// Get icon based on activity type
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    create: <Database className="w-4 h-4" />,
    update: <Edit className="w-4 h-4" />,
    delete: <Trash2 className="w-4 h-4" />,
    password: <Lock className="w-4 h-4" />,
    share: <Share2 className="w-4 h-4" />,
    query: <MessageSquare className="w-4 h-4" />,
    login: <LogIn className="w-4 h-4" />,
    logout: <LogOut className="w-4 h-4" />,
    schema: <Edit className="w-4 h-4" />,
    open: <FolderOpen className="w-4 h-4" />,
    remove_connection: <Unlink className="w-4 h-4" />,
    request_accepted: <CheckCircle className="w-4 h-4" />,
    access_granted: <KeyRound className="w-4 h-4" />,
    access_updated: <AlertCircle className="w-4 h-4" />,
    friend_removed: <Unlink className="w-4 h-4" />,
  };
  return iconMap[type] || <Database className="w-4 h-4" />;
};

const getActionColor = (type: string, theme: any) => {
  const colors: Record<string, { bg: string; text: string }> = {
    create: { bg: `${theme.success}15`, text: theme.success || "#10b981" },
    update: { bg: `${theme.primary}15`, text: theme.primary },
    delete: { bg: `${theme.danger}15`, text: theme.danger || "#ef4444" },
    password: { bg: `${theme.warning}15`, text: theme.warning || "#f59e0b" },
    share: { bg: `${theme.primary}15`, text: theme.primary },
    query: { bg: `${theme.primary}15`, text: theme.primary },
    login: { bg: `${theme.success}15`, text: theme.success || "#10b981" },
    logout: { bg: `${theme.danger}15`, text: theme.danger || "#ef4444" },
    schema: { bg: `${theme.primary}15`, text: theme.primary },
    open: { bg: `${theme.primary}15`, text: theme.primary },
    remove_connection: { bg: `${theme.danger}15`, text: theme.danger || "#ef4444" },
    request_accepted: { bg: `${theme.success}15`, text: theme.success || "#10b981" },
    access_granted: { bg: `${theme.primary}15`, text: theme.primary },
    access_updated: { bg: `${theme.warning}15`, text: theme.warning || "#f59e0b" },
    friend_removed: { bg: `${theme.danger}15`, text: theme.danger || "#ef4444" },
  };
  return colors[type] || { bg: `${theme.primary}15`, text: theme.primary };
};

const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateObj = new Date(date);
  const isToday = dateObj.toDateString() === today.toDateString();
  const isYesterday = dateObj.toDateString() === yesterday.toDateString();

  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const time = `${hours}:${minutes}`;

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;

  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${month}/${day}/${year} ${time}`;
};

export default function HistoryPage() {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "day" | "week" | "month" | "single" | "custom-range">("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch activities on component mount
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      const data = await fetchActivities();
      setActivities(data);
      setLoading(false);
    };
    loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    let filtered: ActivityLog[] = activities;
    const now = new Date();

    // Filter by time range
    if (filterType === "day") {
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a: ActivityLog) => a.timestamp >= dayAgo);
    } else if (filterType === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a: ActivityLog) => a.timestamp >= weekAgo);
    } else if (filterType === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a: ActivityLog) => a.timestamp >= monthAgo);
    } else if (filterType === "single" && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const nextDay = new Date(selectedDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      filtered = filtered.filter(
        (a: ActivityLog) => a.timestamp >= selectedDateObj && a.timestamp < nextDay
      );
    } else if (filterType === "custom-range" && startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const nextDay = new Date(endDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      filtered = filtered.filter(
        (a: ActivityLog) => a.timestamp >= startDateObj && a.timestamp < nextDay
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a: ActivityLog) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a: ActivityLog, b: ActivityLog) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [searchQuery, filterType, selectedDate, startDate, endDate, activities]);

  return (
    <div style={{ backgroundColor: currentTheme.background, color: currentTheme.text }} className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity History</h1>
        <p style={{ color: currentTheme.textSecondary }} className="text-sm">
          Track all your database activities and account actions
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5" style={{ color: currentTheme.textSecondary }} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border transition-all"
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border,
              color: currentTheme.text,
            }}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        {[
          { key: "all" as const, label: "All Time" },
          { key: "day" as const, label: "Last 24 Hours" },
          { key: "week" as const, label: "Last 7 Days" },
          { key: "month" as const, label: "Last 30 Days" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => {
              setFilterType(filter.key);
              setShowDatePicker(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === filter.key
                ? "text-white"
                : "border"
            }`}
            style={{
              backgroundColor: filterType === filter.key ? currentTheme.primary : "transparent",
              borderColor: filterType === filter.key ? currentTheme.primary : currentTheme.border,
              color: filterType === filter.key ? "#ffffff" : currentTheme.text,
            }}
          >
            {filter.label}
          </button>
        ))}

        {/* Single Date Button */}
        <div className="relative">
          <button
            onClick={() => {
              if (filterType === "single") {
                setShowDatePicker(!showDatePicker);
              } else {
                setFilterType("single");
                setShowDatePicker(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filterType === "single"
                ? "text-white"
                : "border"
            }`}
            style={{
              backgroundColor: filterType === "single" ? currentTheme.primary : "transparent",
              borderColor: filterType === "single" ? currentTheme.primary : currentTheme.border,
              color: filterType === "single" ? "#ffffff" : currentTheme.text,
            }}
          >
            Single Date
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Single Date Picker Dropdown */}
          {showDatePicker && filterType === "single" && (
            <div
              className="absolute top-full mt-2 p-4 rounded-lg shadow-lg z-10 flex gap-3"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: currentTheme.textSecondary }}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded border text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (selectedDate) {
                    setShowDatePicker(false);
                  }
                }}
                disabled={!selectedDate}
                className="px-4 py-2 rounded text-white font-medium self-end disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Custom Range Button */}
        <div className="relative">
          <button
            onClick={() => {
              if (filterType === "custom-range") {
                setShowDatePicker(!showDatePicker);
              } else {
                setFilterType("custom-range");
                setShowDatePicker(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filterType === "custom-range"
                ? "text-white"
                : "border"
            }`}
            style={{
              backgroundColor: filterType === "custom-range" ? currentTheme.primary : "transparent",
              borderColor: filterType === "custom-range" ? currentTheme.primary : currentTheme.border,
              color: filterType === "custom-range" ? "#ffffff" : currentTheme.text,
            }}
          >
            Custom Range
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Custom Range Date Picker Dropdown */}
          {showDatePicker && filterType === "custom-range" && (
            <div
              className="absolute top-full mt-2 p-4 rounded-lg shadow-lg z-10"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="space-y-3 mb-3 min-w-80">
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: currentTheme.textSecondary }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 rounded border text-sm w-full"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: currentTheme.textSecondary }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="px-3 py-2 rounded border text-sm w-full"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: startDate && endDate && new Date(endDate) < new Date(startDate) ? "#ef4444" : currentTheme.border,
                      color: currentTheme.text,
                    }}
                  />
                  {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                    <p className="text-xs text-red-500 mt-1">End date cannot be before start date</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
                    setShowDatePicker(false);
                  }
                }}
                disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
                className="w-full px-4 py-2 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center border rounded-lg"
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border,
            }}
          >
            <p style={{ color: currentTheme.textSecondary }}>Loading activities...</p>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((activity: ActivityLog) => {
            const colors = getActionColor(activity.type, currentTheme);
            return (
              <div
                key={activity.id}
                className="p-2 rounded-lg border transition-all hover:shadow-md"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.border,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    <div className="w-4 h-4">{activity.icon}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs mb-0.5">{activity.title}</h3>
                    <p style={{ color: currentTheme.textSecondary }} className="text-xs mb-1 line-clamp-1">
                      {activity.description}
                    </p>
                    <p style={{ color: currentTheme.textSecondary }} className="text-xs">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>

                  {/* Activity Type Badge */}
                  <div
                    className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {activity.type.replace("_", " ")}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="text-center py-12 rounded-lg border"
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border,
            }}
          >
            <p style={{ color: currentTheme.textSecondary }}>No activities found in the selected time range.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filteredActivities.length > 0 && (
        <div
          className="mt-8 p-4 rounded-lg border text-sm"
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
          }}
        >
          <p style={{ color: currentTheme.textSecondary }}>
            Showing <span style={{ color: currentTheme.text }} className="font-semibold">{filteredActivities.length}</span> activit{filteredActivities.length === 1 ? "y" : "ies"} in the selected period
          </p>
        </div>
      )}
    </div>
  );
}