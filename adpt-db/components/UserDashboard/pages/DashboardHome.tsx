import { motion } from "motion/react";
import {
  TrendingUp,
  Database,
  FolderLock,
  ArrowUpRight,
  FileText,
  Layers,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/userContext";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";

type FilterType = "day" | "week" | "month";
type ChartPoint = { label: string; visits: number };

type StatsData = {
  totalDatabases: number;
  totalRecords: number;
  totalFields: number;
  totalInvoices: number;
};

export default function DashboardHome() {
  const { currentTheme } = useTheme();
  const { user } = useUserContext();

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Visit analytics
  const [visitFilter, setVisitFilter] = useState<FilterType>("week");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

  const router = useRouter();

  // Fetch real dashboard stats
  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const res = await axios.get("/api/databases");
        const databases = res.data.databases || [];

        let totalRecords = 0;
        let totalFields = 0;
        let totalInvoices = 0;

        for (const db of databases) {
          totalRecords += db.recordCount || 0;
          totalFields += db.formSchema?.length || 0;
          totalInvoices += db.generatedInvoices?.length || 0;
        }

        setStats({
          totalDatabases: databases.length,
          totalRecords,
          totalFields,
          totalInvoices,
        });
      } catch {
        setStats({
          totalDatabases: 0,
          totalRecords: 0,
          totalFields: 0,
          totalInvoices: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch visit analytics (with a small delay on mount to allow VisitTracker POST to complete first)
  useEffect(() => {
    async function fetchVisits() {
      setChartLoading(true);
      try {
        const res = await axios.get(
          `/api/analytics/visits?filter=${visitFilter}`
        );
        setChartData(res.data.chartData || []);
        setTotalVisits(res.data.totalVisits || 0);
      } catch {
        setChartData([]);
        setTotalVisits(0);
      } finally {
        setChartLoading(false);
      }
    }

    // Small delay so VisitTracker's POST finishes before we GET
    const timer = setTimeout(fetchVisits, 800);
    return () => clearTimeout(timer);
  }, [visitFilter]);

  const statCards = [
    {
      label: "Total Databases",
      value: stats?.totalDatabases ?? "—",
      icon: FolderLock,
    },
    {
      label: "Total Records",
      value: stats?.totalRecords ?? "—",
      icon: Database,
    },
    {
      label: "Total Fields",
      value: stats?.totalFields ?? "—",
      icon: Layers,
    },
    {
      label: "Total Invoices",
      value: stats?.totalInvoices ?? "—",
      icon: FileText,
    },
  ];

  const quickActions = [
    { label: "Create Database", icon: Database, link:'/databases' },
    { label: "New Folder", icon: FolderLock, link:'/databases' },
    { label: "Share Data", icon: ArrowUpRight, link:'/share-folder' },
    { label: "View Analytics", icon: TrendingUp, link:'/analytics' },
  ];

  const filters: { label: string; value: FilterType }[] = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
  ];

  return (
    <div>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
            style={{ color: currentTheme.text }}
          >
            Welcome back, {user?.userName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: currentTheme.textSecondary }}
          >
            Here&apos;s what&apos;s happening with your databases today
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
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
                </div>
                <p
                  className="text-sm mb-1"
                  style={{ color: currentTheme.textSecondary }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
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
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: currentTheme.text }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
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
                  <p
                    className="font-medium text-sm"
                    style={{ color: currentTheme.text }}
                  >
                    {action.label}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Visit Analytics Bar Chart */}
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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <BarChart3
                className="w-6 h-6"
                style={{ color: currentTheme.primary }}
              />
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  Site Visits
                </h2>
                <p
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  {totalVisits} total visit{totalVisits !== 1 ? "s" : ""} this{" "}
                  {visitFilter}
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: `1px solid ${currentTheme.border}` }}
            >
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setVisitFilter(f.value)}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      visitFilter === f.value
                        ? currentTheme.primary
                        : currentTheme.background,
                    color:
                      visitFilter === f.value
                        ? "#fff"
                        : currentTheme.textSecondary,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-80">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: currentTheme.primary }}
                />
              </div>
            ) : chartData.length === 0 ? (
              <div
                className="flex items-center justify-center h-full text-sm"
                style={{ color: currentTheme.textSecondary }}
              >
                No visit data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={currentTheme.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: currentTheme.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: currentTheme.border }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: currentTheme.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: currentTheme.surface,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: "12px",
                      color: currentTheme.text,
                      fontSize: 13,
                    }}
                    cursor={{ fill: `${currentTheme.primary}15` }}
                    formatter={(value: number) => [value, "Visits"]}
                  />
                  <Bar dataKey="visits" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={currentTheme.primary}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
