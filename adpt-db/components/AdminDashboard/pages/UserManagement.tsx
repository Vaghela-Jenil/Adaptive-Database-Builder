"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2, Ban, ChevronLeft, ChevronRight, X, UserPlus,
  Eye, EyeOff, ShieldAlert, Mail, Calendar, Phone,
  Loader2,
  BarChart3
} from "lucide-react";
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
import { useTheme } from "@/context/ThemeContext";

type FilterType = "day" | "week" | "month";
type ChartPoint = { label: string; visits: number };

export default function UserManagement() {
  const { currentTheme } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 8;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPanel, setConfirmPanel] = useState<{ show: boolean, type: 'delete' | 'ban', user: any | null }>({
    show: false, type: 'delete', user: null
  });

    // Visit analytics
    const [visitFilter, setVisitFilter] = useState<FilterType>("week");
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [totalVisits, setTotalVisits] = useState(0);
    const [chartLoading, setChartLoading] = useState(true);

  const [formData, setFormData] = useState({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "user",
  phonenumber: ""
});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/users?limit=${limit}&offset=${page * limit}`);
      setUsers(data.data);
      setTotalUsers(data.totalCount);
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

    const filters: { label: string; value: FilterType }[] = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
  ];

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

  const handleAction = async () => {
    const { type, user } = confirmPanel;
    if (!user) return;
    setLoading(true);
    try {
      if (type === 'delete') {
        await axios.delete(`/api/admin/users/${user.id}`);
      } else {
        const isCurrentlyBanned = user.status === 'banned';
        await axios.patch(`/api/admin/users/${user.id}`, {
          banned: !isCurrentlyBanned,
          role: user.role
        });
      }
      setConfirmPanel({ show: false, type: 'delete', user: null });
      fetchUsers();
    } catch (err) { alert("Action failed"); }
    finally { setLoading(false); }
  };

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target; 
  setFormData((prev) => ({
    ...prev,
    [name]: value, 
  })); 
};

const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
    alert("Please fill in all required fields (Name, Email, Password).");
    return;
  }
  setLoading(true);
  try {
    await axios.post("/api/admin/users", formData);
    setIsCreateModalOpen(false);
    setFormData({ email: "", password: "", firstName: "", lastName: "", role: "user", phonenumber: "" });
    fetchUsers();
    alert("User created successfully!");
  } catch (err: any) {
    console.error(err);
    alert(err.response?.data?.error || "Failed to create user.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="p-6 space-y-6 flex flex-col  overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black" style={{ color: currentTheme.text }}>Identity Manager</h2>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
          <UserPlus size={20} /> Add User
        </button>
      </div>

      <div className="flex-1 rounded-3xl border overflow-hidden flex flex-col" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: currentTheme.background }}>
              <tr className="text-left border-b" style={{ borderColor: currentTheme.border }}>
                <th className="p-5 text-xs font-bold uppercase" style={{ color: currentTheme.textSecondary }}>User</th>
                <th className="p-5 text-xs font-bold uppercase" style={{ color: currentTheme.textSecondary }}>Contact</th>
                <th className="p-5 text-xs font-bold uppercase" style={{ color: currentTheme.textSecondary }}>Presence</th>
                 <th className="p-5 text-xs font-bold uppercase text-right" style={{ color: currentTheme.textSecondary }}>Ban</th>
                <th className="p-5 text-xs font-bold uppercase text-right" style={{ color: currentTheme.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isToday = user.lastActiveAt && new Date(user.lastActiveAt).toDateString() === new Date().toDateString();
                const isBanned = user.status === 'banned';
                return (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-black/5" style={{ borderColor: currentTheme.border }}>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img src={user.imageUrl} className="w-11 h-11 rounded-xl border object-cover" alt="" />
                        <div>
                          <p className="font-bold text-sm" style={{ color: currentTheme.text }}>{user.name}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-xs" style={{ color: currentTheme.textSecondary }}>
                      <div className="flex items-center gap-2 truncate max-w-50"><Mail size={12} /> {user.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12} /> {user.phonenumber || 'N/A'}</div>
                    </td>
                    <td className="p-5 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isBanned ? 'bg-red-500' : isToday ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span style={{ color: isBanned ? '#ef4444' : isToday ? '#22c55e' : currentTheme.textSecondary }}>
                          {isBanned ? "BANNED" : isToday ? "ACTIVE TODAY" : new Date(user.lastActiveAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setConfirmPanel({ show: true, type: 'ban', user })} className={`p-2 rounded-lg transition-all ${isBanned ? 'bg-red-500 text-white' : 'hover:bg-orange-500/10 text-orange-500'}`}><Ban size={18} /></button>
                      </div>
                    </td>
                     <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setConfirmPanel({ show: true, type: 'delete', user })} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
          <p className="text-xs font-bold" style={{ color: currentTheme.textSecondary }}>PAGE {page + 1} OF {Math.max(1, Math.ceil(totalUsers / limit))}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border disabled:opacity-20"><ChevronLeft /></button>
            <button disabled={(page + 1) * limit >= totalUsers} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border disabled:opacity-20"><ChevronRight /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg p-10 rounded-[40px] shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 text-black">
              <h3 className="text-2xl font-black">New Operative</h3>
              <button onClick={() => setIsCreateModalOpen(false)}><X /></button>
            </div>

           
      <form onSubmit={handleCreateUser} className="space-y-4 text-black">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="firstName"
            required
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
          />

          <input
            name="lastName"
            required
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
          />
        </div>

        <input
          name="email"
          type="email"
          required
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
        />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password (8+ chars)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <input
          name="phonenumber"
          placeholder="Phone Number (Optional)"
          value={formData.phonenumber}
          onChange={handleChange}
          className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
          </div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmPanel.show && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-sm w-full p-8 rounded-[32px]" style={{ backgroundColor: currentTheme.surface }}>
              <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-center mb-2">Confirm {confirmPanel.type === 'delete' ? 'Delete' : 'Status'}</h3>
              <p className="text-sm text-center mb-8 opacity-70">Apply changes to <b>{confirmPanel.user?.name}</b>?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmPanel({ show: false, type: 'delete', user: null })} className="flex-1 py-3 rounded-xl bg-gray-500/10 font-bold">Cancel</button>
                <button onClick={handleAction} disabled={loading} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold">{loading ? "Wait..." : "Confirm"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  );
}