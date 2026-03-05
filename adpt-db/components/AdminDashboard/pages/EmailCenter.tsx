'use client'

import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Loader2, Send, Mail, User as UserIcon, X, 
  Sparkles, History, Paperclip, Eye, FileText, CheckCircle2 
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { sendAdminEmail } from "@/app/actions/email";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// --- Types ---
interface UserProfile {
  userName: string;
  email: string;
}

interface ApiResponse {
  success: boolean;
  users?: UserProfile[];
  error?: string;
}

export default function EmailCenter() {
  const { currentTheme } = useTheme();

  // Form State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  
  // UI State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  
  // Files State
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic: Fetch Logs ---
  const fetchLogs = async () => {
    try {
      const { data } = await axios.get("/api/admin/email-logs");
      if (data.success) setEmailLogs(data.data);
    } catch (err) {
      console.error("Could not fetch logs");
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  // --- Logic: Search Autocomplete ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length > 1 && !targetUser) {
        performSearch(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, targetUser]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data } = await axios.post<ApiResponse>("/api/admin/users/search", { query });
      if (data.success) setSuggestions(data.users || []);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // --- Logic: File Management ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertUserTag = () => setMessage((prev) => prev + " {{userName}}");

  // --- Logic: Send Email ---
  const handleSend = async () => {
    if (!targetUser) return toast.warn("Please select a recipient");
    setIsSending(true);

    try {
      // Convert files to Base64 for Resend
      const attachments = await Promise.all(attachedFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const content = Buffer.from(buffer).toString('base64');
        return { content, filename: file.name };
      }));

      const res = await sendAdminEmail({
        toEmail: targetUser.email,
        userName: targetUser.userName,
        subject,
        message,
        attachments
      });

      if (res.success) {
        toast.success(`Email dispatched to ${targetUser.email}`);
        setSubject(""); setMessage(""); setTargetUser(null); 
        setSearchQuery(""); setAttachedFiles([]);
        fetchLogs();
      } else {
        toast.error(res.error || "Failed to send");
      }
    } catch (err) {
      toast.error("Internal process error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <ToastContainer position="top-right" theme="colored" />

      {/* 1. VIEW DETAILS MODAL PANEL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl rounded-[2.5rem] border-2 shadow-2xl overflow-hidden"
              style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
            >
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: currentTheme.border }}>
                <h3 className="font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
                   <Eye className="w-4 h-4 text-blue-500" /> Dispatch History Details
                </h3>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-black/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase opacity-40">Sent To</span>
                        <p className="font-bold text-sm" style={{ color: currentTheme.text }}>{selectedLog.recipientEmail}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase opacity-40">Timestamp</span>
                        <p className="font-bold text-sm">{new Date(selectedLog.sentAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-black/5 border-2 italic text-sm leading-relaxed" 
                     style={{ borderColor: currentTheme.border }}
                     dangerouslySetInnerHTML={{ __html: selectedLog.body }} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. MAIN COMPOSER (LEFT) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 rounded-[2.5rem] border-2 shadow-2xl overflow-hidden"
          style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
        >
          <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3" style={{ color: currentTheme.text }}>
              <div className="p-2 rounded-xl bg-blue-500/10"><Mail className="text-blue-500" /></div>
              Outreach Hub
            </h1>
          </div>

          <div className="p-8 space-y-6">
            {/* Search */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Search Recipient</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" style={{color: currentTheme.text}} />
                <input 
                  type="text"
                  placeholder="Type email..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 bg-black/5 outline-none focus:bg-transparent transition-all"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                  value={targetUser ? targetUser.email : searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!!targetUser}
                />
                {targetUser && (
                  <button onClick={() => {setTargetUser(null); setSearchQuery("");}} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"><X size={18}/></button>
                )}
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div className="absolute z-50 w-full mt-2 rounded-2xl border-2 shadow-2xl overflow-hidden"
                    style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
                    {suggestions.map((user) => (
                      <button key={user.email} onClick={() => {setTargetUser(user); setSuggestions([]);}}
                        className="w-full p-4 flex items-center gap-3 hover:bg-blue-500/5 transition-all text-left">
                        <UserIcon className="w-4 h-4 opacity-40" />
                        <span className="text-sm font-bold" style={{ color: currentTheme.text }}>{user.email}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inputs */}
            <input 
              placeholder="Subject Line"
              className="w-full p-4 rounded-2xl border-2 bg-black/5 outline-none"
              style={{ borderColor: currentTheme.border, color: currentTheme.text }}
              value={subject} onChange={(e) => setSubject(e.target.value)}
            />
            
            <div className="relative">
              <textarea 
                placeholder="Compose message..." rows={8}
                className="w-full p-6 rounded-[2rem] border-2 bg-black/5 outline-none resize-none"
                style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                value={message} onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={insertUserTag} className="absolute bottom-6 right-6 px-4 py-2 rounded-xl border-2 text-[10px] font-bold uppercase bg-white/10 hover:bg-blue-500 hover:text-white transition-all shadow-md"
                style={{ borderColor: currentTheme.border }}>
                <Sparkles size={12} className="inline mr-2" /> Add Name Tag
              </button>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed text-[10px] font-bold uppercase opacity-60 hover:opacity-100 transition-all"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}>
                  <Paperclip size={14} /> Attach Files
                </button>
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                
                <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold">
                            <FileText size={12} className="text-blue-500" /><span  className="text-blue-500" > {file.name}</span>
                            <X size={12} className="cursor-pointer text-red-500" onClick={() => removeFile(i)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Dispatch */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-dashed" style={{ borderColor: currentTheme.border }}>
              <div className="text-[10px] font-black uppercase opacity-30 italic">
                {targetUser ? `Target: ${targetUser.userName}` : "Awaiting Selection"}
              </div>
              <button onClick={handleSend} disabled={isSending || !targetUser}
                className="flex items-center gap-3 px-12 py-4 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 disabled:opacity-20"
                style={{ backgroundColor: currentTheme.primary }}>
                {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
                {isSending ? "DISPATCHING..." : "SEND OUTREACH"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3. ACTIVITY SIDEBAR (RIGHT) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
          <div className="p-8 rounded-[2.5rem] border-2 shadow-xl sticky top-8" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <History size={16} className="text-blue-500" /> <span className="text-blue-500">Recent Activity</span>
            </h3>
            <div className="space-y-4">
              {emailLogs.length === 0 ? (
                <p className="text-center py-10 text-[10px] font-bold uppercase opacity-20">No data found</p>
              ) : (
                emailLogs.map((log) => (
                  <div key={log._id} className="p-4 rounded-2xl border-2 bg-black/5 flex flex-col gap-2 group transition-all" style={{ borderColor: currentTheme.border }}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[11px] truncate w-35" style={{ color: currentTheme.text }}>{log.subject}</span>
                      <button onClick={() => setSelectedLog(log)} className="text-[9px] font-black text-blue-500 hover:underline">View</button>
                    </div>
                    <p className="text-[10px] opacity-50 truncate" style={{color: currentTheme.text}}>{log.recipientEmail}</p>
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 w-max text-[8px] font-black text-green-500 uppercase">
                        <div className="w-1 h-1 rounded-full bg-green-500" /> {log.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}