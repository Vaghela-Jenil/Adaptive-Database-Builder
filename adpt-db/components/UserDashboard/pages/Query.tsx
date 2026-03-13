"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle, Clock, X, MessageSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";

// 1. Define the Query Type
interface SupportQuery {
  _id: string;
  subject: string;
  message: string;
  status: "pending" | "resolved";
  adminReply?: string; // Optional because it's empty until resolved
  isReadByUser: boolean;
  createdAt: string;
}

export default function UserSupport() {
  const { currentTheme } = useTheme();
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [viewingQuery, setViewingQuery] = useState<SupportQuery | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueries = async () => {
    try {
      const res = await axios.get("/api/queries");
      setQueries(res.data);
    } catch (err) {
      console.error("Error fetching queries", err);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/queries", { subject, message });
      if (res.data.success) {
        setSubject("");
        setMessage("");
        fetchQueries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQuery = async (query: SupportQuery) => {
    setViewingQuery(query);
    // If the admin replied and user hasn't seen it yet, mark as read
    if (query.status === "resolved" && !query.isReadByUser) {
      try {
        await fetch(`/api/queries/${query._id}/read`, { method: "PATCH" });
        fetchQueries(); // Update list to clear notification badges
      } catch (err) {
        console.error("Could not mark as read", err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit Form */}
        <div className="p-6 rounded-2xl border h-fit" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: currentTheme.text }}>
            <MessageSquare className="w-5 h-5" style={{ color: currentTheme.primary }} />
            New Support Ticket
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="What do you need help with?" 
              className="w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-1" 
              style={{ borderColor: currentTheme.border, color: currentTheme.text, "--tw-ring-color": currentTheme.primary } as any} 
              required 
            />
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Please provide details so we can assist you better..." 
              rows={5} 
              className="w-full p-3 rounded-xl border bg-transparent resize-none outline-none focus:ring-1" 
              style={{ borderColor: currentTheme.border, color: currentTheme.text, "--tw-ring-color": currentTheme.primary } as any} 
              required 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50" 
              style={{ backgroundColor: currentTheme.primary }}
            >
              {isSubmitting ? "Sending..." : <><Send className="w-4 h-4" /> Submit Ticket</>}
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-widest opacity-40" style={{ color: currentTheme.text }}>Ticket History</h2>
          <div className="space-y-3">
            {queries.length > 0 ? (
              queries.map(q => (
                <div 
                  key={q._id} 
                  onClick={() => handleOpenQuery(q)} 
                  className="p-4 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all group" 
                  style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm group-hover:underline" style={{ color: currentTheme.text }}>{q.subject}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase ${q.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs opacity-60 truncate mb-2" style={{ color: currentTheme.textSecondary }}>{q.message}</p>
                  <div className="flex items-center gap-2 opacity-40 text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                    {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed rounded-2xl opacity-30" style={{ borderColor: currentTheme.border }}>
                <p style={{ color: currentTheme.textSecondary }}>No tickets found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Reply Modal */}
      <AnimatePresence>
        {viewingQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setViewingQuery(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl p-6 relative z-10 shadow-2xl" 
              style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-blue-500" />
                   <h2 className="font-bold text-lg" style={{ color: currentTheme.text }}>Ticket Details</h2>
                </div>
                <X className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => setViewingQuery(null)} style={{ color: currentTheme.text }} />
              </div>
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-black opacity-40" style={{ color: currentTheme.text }}>Your Message</span>
                  <div className="p-4 rounded-xl mt-1 text-sm bg-black/5 border border-black/5" style={{ color: currentTheme.text }}>
                    <p className="font-bold mb-1">{viewingQuery.subject}</p>
                    {viewingQuery.message}
                  </div>
                </div>

                {/* --- THIS SHOWS THE ADMIN REPLY --- */}
                {viewingQuery.adminReply ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="text-[10px] uppercase font-black text-green-500">Official Response</span>
                    <div className="p-4 rounded-xl mt-1 text-sm bg-green-500/5 border border-green-500/20 shadow-inner" style={{ color: currentTheme.text }}>
                      {viewingQuery.adminReply}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <p className="text-xs font-medium text-orange-500/80">Our team is currently reviewing your request.</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setViewingQuery(null)}
                className="w-full mt-8 py-3 rounded-xl font-bold opacity-70 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: currentTheme.background, color: currentTheme.text, border: `1px solid ${currentTheme.border}` }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}