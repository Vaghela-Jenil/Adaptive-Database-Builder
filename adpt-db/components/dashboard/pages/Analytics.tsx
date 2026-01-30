"use client";

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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
    { label: "Total Views", value: "7.8K", change: "+23.5%", trend: "up", icon: Eye },
    { label: "Active Users", value: "3.0K", change: "+18.2%", trend: "up", icon: Users },
    { label: "API Requests", value: "1.2M", change: "+31.4%", trend: "up", icon: Activity },
    { label: "Database Size", value: "2.4GB", change: "+12.8%", trend: "up", icon: Database },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold"
          >
            Analytics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            Track performance and system insights
          </motion.p>
        </div>

        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div
                    className={`flex items-center gap-1 text-sm ${
                      metric.trend === "up"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    <TrendIcon className="w-4 h-4" />
                    {metric.change}
                  </div>
                </div>

                <p className="text-3xl font-semibold">{metric.value}</p>
                <p className="text-muted-foreground text-sm">{metric.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Performance</h2>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Last 6 months
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="records"
                stroke="hsl(var(--foreground))"
                fill="hsl(var(--foreground))"
                fillOpacity={0.08}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.06}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Database Usage</h2>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={databaseUsage}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={6}
              >
                {databaseUsage.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(var(--foreground))`}
                    opacity={1 - i * 0.12}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {databaseUsage.map((item) => (
              <div
                key={item.name}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">User Activity</h2>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="users"
              fill="hsl(var(--foreground))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
