"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2, Ban, ChevronLeft, ChevronRight, X, UserPlus,
  Eye, EyeOff, ShieldAlert, Mail, Calendar, Phone
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

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

  const handleChange = (e: any) => {
    const {key, value} = e.target
    setFormData((prev) =>( {
      ...prev, 
      [key] : value
    }));
  }

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
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
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
                  required
                  placeholder="First Name"
                  value={formData.firstName}
                  className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
                 onChange={e => handleChange(e)}
                />
                <input
                  required
                  placeholder="Last Name"
                  value={formData.lastName}
                  className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
                  onChange={e => handleChange(e)}
                />
              </div>

              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
               onChange={e => handleChange(e)}
              />

              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (8+ chars)"
                  value={formData.password}
                  className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
                 onChange={e => handleChange(e)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <input
                placeholder="Phone Number (Optional)"
                value={formData.phonenumber}
                className="w-full p-4 rounded-2xl border border-gray-300 outline-none"
                onChange={e => handleChange(e)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Create Account"}
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
    </div>
  );
}