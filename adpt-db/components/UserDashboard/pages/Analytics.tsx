import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Eye,
  Database,
  Download,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Analytics() {
  const { currentTheme } = useTheme();

  const performanceData = [
    { month: "Jan", records: 4000, views: 2400, users: 800 },
    { month: "Feb", records: 3000, views: 1398, users: 600 },
    { month: "Mar", records: 5000, views: 9800, users: 1200 },
    { month: "Apr", records: 7800, views: 3908, users: 1800 },
    { month: "May", records: 8900, views: 4800, users: 2200 },
    { month: "Jun", records: 12458, views: 7800, users: 3000 },
  ];

  const databaseUsage = [
    { name: "Customer Data", value: 35 },
    { name: "Inventory", value: 25 },
    { name: "Financial", value: 20 },
    { name: "Projects", value: 15 },
    { name: "Others", value: 5 },
  ];

  const metrics = [
    {
      label: "Total Views",
      value: "7.8K",
      change: "+23.5%",
      trend: "up",
      icon: Eye,
    },
    {
      label: "Active Users",
      value: "3.0K",
      change: "+18.2%",
      trend: "up",
      icon: Users,
    },
    {
      label: "API Requests",
      value: "1.2M",
      change: "+31.4%",
      trend: "up",
      icon: Activity,
    },
    {
      label: "Database Size",
      value: "2.4GB",
      change: "+12.8%",
      trend: "up",
      icon: Database,
    },
  ];

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
            Analytics Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: currentTheme.textSecondary }}
          >
            Track your data performance and insights
          </motion.p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
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
                  {metric.change}
                </div>
              </div>
              <p className="text-sm mb-1" style={{ color: currentTheme.textSecondary }}>
                {metric.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: currentTheme.text }}>
                {metric.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.text }}>
            Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentTheme.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={currentTheme.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.border}
                opacity={0.3}
              />
              <XAxis
                dataKey="month"
                stroke={currentTheme.textSecondary}
                style={{ fontSize: 12 }}
              />
              <YAxis
                stroke={currentTheme.textSecondary}
                style={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "12px",
                  color: currentTheme.text,
                }}
              />
              <Area
                type="monotone"
                dataKey="records"
                stroke={currentTheme.primary}
                strokeWidth={2}
                fill="url(#colorRecords)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Database Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.text }}>
            Database Usage
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={databaseUsage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill={currentTheme.primary}
                dataKey="value"
                label
              >
                {databaseUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={currentTheme.primary} opacity={1 - index * 0.15} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "12px",
                  color: currentTheme.text,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {databaseUsage.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentTheme.primary, opacity: 1 - index * 0.15 }}
                  />
                  <span className="text-sm" style={{ color: currentTheme.text }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.text }}>
          Monthly Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={currentTheme.border}
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              stroke={currentTheme.textSecondary}
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke={currentTheme.textSecondary}
              style={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "12px",
                color: currentTheme.text,
              }}
            />
            <Bar dataKey="records" fill={currentTheme.primary} radius={[8, 8, 0, 0]} />
            <Bar
              dataKey="views"
              fill={currentTheme.primary}
              opacity={0.5}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
