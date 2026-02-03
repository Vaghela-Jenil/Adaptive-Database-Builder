import { motion } from "motion/react";
import { Search, MoreVertical, UserCheck, UserX, Mail, Eye } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function UserManagement() {
  const { currentTheme } = useTheme();

  const users = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      role: "Administrator",
      status: "active",
      lastActive: "2 hours ago",
      avatar: "SC",
    },
    {
      id: 2,
      name: "Mike Johnson",
      email: "mike.j@company.com",
      role: "Editor",
      status: "active",
      lastActive: "5 minutes ago",
      avatar: "MJ",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.r@company.com",
      role: "Viewer",
      status: "inactive",
      lastActive: "3 days ago",
      avatar: "ER",
    },
    {
      id: 4,
      name: "Alex Turner",
      email: "alex.turner@company.com",
      role: "Editor",
      status: "active",
      lastActive: "1 hour ago",
      avatar: "AT",
    },
    {
      id: 5,
      name: "Jessica Williams",
      email: "j.williams@company.com",
      role: "Administrator",
      status: "active",
      lastActive: "30 minutes ago",
      avatar: "JW",
    },
    {
      id: 6,
      name: "David Kim",
      email: "david.kim@company.com",
      role: "Viewer",
      status: "inactive",
      lastActive: "1 week ago",
      avatar: "DK",
    },
  ];

  const stats = [
    { label: "Total Users", value: "248", change: "+12" },
    { label: "Active Now", value: "142", change: "+8" },
    { label: "New This Week", value: "23", change: "+15%" },
    { label: "Pending Invites", value: "7", change: "-2" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-xl"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <p className="text-sm mb-2" style={{ color: currentTheme.textSecondary }}>
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold" style={{ color: currentTheme.text }}>
                {stat.value}
              </h3>
              <span className="text-sm font-medium" style={{ color: currentTheme.primary }}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <Search className="w-5 h-5" style={{ color: currentTheme.textSecondary }} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="flex-1 bg-transparent outline-none"
            style={{ color: currentTheme.text }}
          />
        </div>
        <button
          className="px-6 py-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: currentTheme.primary }}
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                <th
                  className="text-left px-6 py-4 font-medium text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  User
                </th>
                <th
                  className="text-left px-6 py-4 font-medium text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Role
                </th>
                <th
                  className="text-left px-6 py-4 font-medium text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Status
                </th>
                <th
                  className="text-left px-6 py-4 font-medium text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Last Active
                </th>
                <th
                  className="text-left px-6 py-4 font-medium text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  style={{ borderBottom: `1px solid ${currentTheme.border}` }}
                  className="hover:bg-opacity-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.text }}>
                          {user.name}
                        </p>
                        <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text,
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.status === "active" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm capitalize" style={{ color: currentTheme.text }}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                      {user.lastActive}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                        }}
                      >
                        <Eye className="w-4 h-4" style={{ color: currentTheme.text }} />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                        }}
                      >
                        <Mail className="w-4 h-4" style={{ color: currentTheme.text }} />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                        }}
                      >
                        <MoreVertical className="w-4 h-4" style={{ color: currentTheme.text }} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
