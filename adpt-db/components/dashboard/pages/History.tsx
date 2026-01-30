import { motion } from "motion/react";
import {
  Database,
  FileText,
  Trash2,
  Edit,
  FolderOpen,
  Users,
  Settings,
  ArrowUpRight,
  Filter,
  Search,
} from "lucide-react";
import { Card } from "../../ui/card";

export default function History() {
  const historyItems = [
    {
      action: "Created new database",
      item: "Customer Records",
      user: "Sarah Chen",
      timestamp: new Date(Date.now() - 120000),
      icon: Database,
      color: "from-cyan-500 to-blue-600",
    },
    {
      action: "Updated record",
      item: "Invoice #INV-2024-0156",
      user: "Mike Johnson",
      timestamp: new Date(Date.now() - 900000),
      icon: Edit,
      color: "from-blue-500 to-purple-600",
    },
    {
      action: "Shared folder",
      item: "Q1 Financial Reports",
      user: "Emily Rodriguez",
      timestamp: new Date(Date.now() - 3600000),
      icon: FolderOpen,
      color: "from-purple-500 to-pink-600",
    },
    {
      action: "Deleted records",
      item: "3 duplicate entries",
      user: "Alex Turner",
      timestamp: new Date(Date.now() - 7200000),
      icon: Trash2,
      color: "from-rose-500 to-red-600",
    },
    {
      action: "Added team member",
      item: "Jessica Williams",
      user: "John Doe",
      timestamp: new Date(Date.now() - 10800000),
      icon: Users,
      color: "from-emerald-500 to-green-600",
    },
    {
      action: "Modified settings",
      item: "API Configuration",
      user: "David Kim",
      timestamp: new Date(Date.now() - 14400000),
      icon: Settings,
      color: "from-amber-500 to-orange-600",
    },
    {
      action: "Generated report",
      item: "Monthly Summary Report",
      user: "Sarah Chen",
      timestamp: new Date(Date.now() - 18000000),
      icon: FileText,
      color: "from-cyan-500 to-blue-600",
    },
  ];

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 60) return `${m} min ago`;
    if (h < 24) return `${h} hrs ago`;
    return `${d} days ago`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            Activity History
          </motion.h1>
          <p className="text-muted-foreground">
            Track all changes and actions in your workspace
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border hover:border-cyan-500/40 transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition">
            <ArrowUpRight className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4 bg-background/60 backdrop-blur-xl border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            placeholder="Search activity history..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/40 border border-border focus:border-cyan-500/40 outline-none transition"
          />
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 bg-background/60 backdrop-blur-xl border-border/50">
        <div className="space-y-4">
          {historyItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                {i !== historyItems.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-0 w-px bg-border" />
                )}

                <div className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:border-cyan-500/40 transition group">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} blur-lg opacity-30`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground group-hover:text-cyan-400 transition">
                          {item.action}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.item}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 text-xs text-white flex items-center justify-center font-semibold">
                        {item.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm text-muted-foreground">{item.user}</span>
                    </div>
                  </div>

                  <button className="w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg bg-muted/50 border border-border hover:bg-muted transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button className="w-full mt-6 py-3 rounded-xl border border-border bg-muted/30 hover:border-cyan-500/40 transition">
          Load more history
        </button>
      </Card>
    </div>
  );
}
