"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { Search, Clock, CheckCircle, AlertCircle, Send, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";

// Define the structure for TypeScript
interface Query {
  _id: string;
  user: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "resolved";
  priority: "low" | "medium" | "high";
  timestamp: string;
  avatar: string;
  adminReply: string;
}

export default function QueryManagement() {
  const { currentTheme } = useTheme();

  // States with Types
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [reply, setReply] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  // --- API WORKING ---
  const fetchQueries = async () => {
    try {
      const res = await axios.get("/api/queries");
      const data = await res.data;
      // Ensure data is an array to prevent .filter errors
      setQueries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add this inside your QueryManagement component
useEffect(() => {
  if (selectedQuery) {
    // Fill the state with existing reply if it exists, otherwise empty
    setReply(selectedQuery.adminReply || "");
  } else {
    setReply("");
  }
}, [selectedQuery]);

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleSendReply = async () => {
    if (!selectedQuery || !reply.trim()) return;

    try {
      const res = await axios.patch(`/api/queries/${selectedQuery._id}`, { adminReply: reply, status: "resolved" });

      if (res.data.success) {
        setReply("");
        setSelectedQuery(null);
        fetchQueries(); // Refresh list
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => (filter === "all" ? true : q.status === filter));
  }, [queries, filter]);

  const stats = [
    { label: "Total Queries", value: queries.length.toString(), color: currentTheme.text },
    { label: "Pending", value: queries.filter(q => q.status === "pending").length.toString(), color: "#f97316" },
    { label: "Resolved", value: queries.filter(q => q.status === "resolved").length.toString(), color: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Queries List */}
      <div className="p-4 lg:col-span-1 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl text-center"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["all", "pending", "resolved"].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{
                backgroundColor: filter === filterOption ? currentTheme.primary : currentTheme.surface,
                border: `1px solid ${filter === filterOption ? currentTheme.primary : currentTheme.border}`,
                color: filter === filterOption ? "#ffffff" : currentTheme.text,
              }}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* List (Scrollable) */}
        <div className="space-y-3 max-h-150 overflow-y-auto">
          {filteredQueries.length > 0 ? (
            filteredQueries.map((query, index) => (
              <motion.button
                key={query._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedQuery(query)}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: selectedQuery?._id === query._id ? currentTheme.primary : currentTheme.surface,
                  border: `1px solid ${selectedQuery?._id === query._id ? currentTheme.primary : currentTheme.border}`,
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
                    style={{
                      backgroundColor: selectedQuery?._id === query._id ? "#ffffff" : currentTheme.primary,
                      color: selectedQuery?._id === query._id ? currentTheme.primary : "#ffffff",
                    }}
                  >
                    {query.avatar || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate" style={{ color: selectedQuery?._id === query._id ? "#ffffff" : currentTheme.text }}>
                        {query.user}
                      </p>
                      {query.status === "pending" ? <Clock className="w-4 h-4 shrink-0" style={{ color: selectedQuery?._id === query._id ? "#ffffff" : currentTheme.textSecondary }} /> : <CheckCircle className="w-4 h-4 shrink-0"  style={{color:  "#32CD32" }} />}
                    </div>
                    <p className="text-sm font-medium mb-1 truncate" style={{ color: selectedQuery?._id === query._id ? "#ffffff" : currentTheme.textSecondary }}>
                      {query.subject}
                    </p>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded inline-block ${query.priority === "high" ? "bg-red-500 text-white" : "bg-gray-500 text-white"}`}>
                  {query.priority} priority
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-10 opacity-40 italic text-sm" style={{ color: currentTheme.textSecondary }}>No queries found.</div>
          )}
        </div>
      </div>

      {/* Query Detail & Reply */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-4 pr-4 lg:col-span-2">
        {selectedQuery ? (
          <div className="rounded-xl p-6 max-h-full flex flex-col" style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white" style={{ backgroundColor: currentTheme.primary }}>
                  {selectedQuery.user.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: currentTheme.text }}>{selectedQuery.subject}</h3>
                  <p className="text-sm" style={{ color: currentTheme.textSecondary }}>From: {selectedQuery.user} ({selectedQuery.email})</p>
                </div>
              </div>
              <button onClick={() => setSelectedQuery(null)} className="p-2 rounded-lg" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.border}` }}>
                <X className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>

            <div className="flex-1 mb-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.border}` }}>
                <p className="leading-relaxed" style={{ color: currentTheme.text }}>{selectedQuery.message}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>Your Reply</label>
              <textarea
                value={reply} // Use the state variable here
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your response here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none mb-4"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text
                }}
              />
              <div className="flex items-center justify-between">
                {
                  selectedQuery.status === 'resolved' ?
                    <button className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ backgroundColor: currentTheme.primary }}>Mark as Resolved</button>
                    :
                    <button className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ backgroundColor: currentTheme.primary }}>Mark as Pending</button>
                }
                <button
                  onClick={handleSendReply}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Send className="w-4 h-4" />
                  {selectedQuery?.adminReply ? "Update Reply" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-12 h-full flex items-center justify-center" style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}>
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: currentTheme.textSecondary }} />
              <p className="text-lg font-medium" style={{ color: currentTheme.textSecondary }}>Select a query to view details</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}