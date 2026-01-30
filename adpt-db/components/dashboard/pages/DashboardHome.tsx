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
import { Card } from "../../ui/card";

export default function DashboardHome() {
  const stats = [
    {
      label: "Total Records",
      value: "12,458",
      change: "+12.5%",
      icon: Database,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Active Databases",
      value: "24",
      change: "+3",
      icon: FolderLock,
      color: "from-blue-500 to-purple-600",
    },
    {
      label: "Team Members",
      value: "48",
      change: "+8",
      icon: Users,
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "API Calls",
      value: "1.2M",
      change: "+23.1%",
      icon: Activity,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const recentActivities = [
    { action: "New database created", database: "Customer Records", time: "2 min ago", user: "Sarah Chen" },
    { action: "Record updated", database: "Inventory System", time: "15 min ago", user: "Mike Johnson" },
    { action: "Folder shared", database: "Financial Reports", time: "1 hr ago", user: "Emily Rodriguez" },
    { action: "API key generated", database: "Analytics Dashboard", time: "3 hrs ago", user: "Alex Turner" },
  ];

  const quickActions = [
    { label: "Create Database", icon: Database, color: "from-cyan-500 to-blue-600" },
    { label: "New Folder", icon: FolderLock, color: "from-blue-500 to-purple-600" },
    { label: "Import Data", icon: ArrowUpRight, color: "from-purple-500 to-pink-600" },
    { label: "View Analytics", icon: TrendingUp, color: "from-pink-500 to-rose-600" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          Welcome back 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Here's what's happening with your data today.
        </motion.p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 bg-background/60 backdrop-blur-xl border-border/50 hover:border-cyan-500/40 transition group">
                <div className="flex justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-foreground group-hover:text-cyan-400 transition">
                  {stat.value}
                </h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div className="lg:col-span-2">
          <Card className="p-6 bg-background/60 backdrop-blur-xl border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {recentActivities.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:border-cyan-500/40 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{a.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.database} • {a.user}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{a.time}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div>
          <Card className="p-6 bg-background/60 backdrop-blur-xl border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
            </div>

            <div className="space-y-3">
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.02 }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border hover:border-cyan-500/40 transition"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-foreground">{a.label}</span>
                    <ArrowUpRight className="ml-auto w-4 h-4 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
