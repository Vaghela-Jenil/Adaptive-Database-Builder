'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, UserPlus, Check, X, Database, Trash2,
    Bell, Users, ArrowRight, ShieldCheck, Mail
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";

interface shareDatabase {
    dbname: string;
    db_Id: string;
}

export default function ThemedNetwork() {
    const { currentTheme } = useTheme();
    // Data States
    const [myId, setMyId] = useState("");
    const [connections, setConnections] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    // UI States
    const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [dbForm, setDbForm] = useState({ name: "", db_id: "", role: "Viewer" });
    const [loading, setLoading] = useState(false);
    const [dbSearchQuery, setDbSearchQuery] = useState("");
    const [showDbDropdown, setShowDbDropdown] = useState(false);
    const [databases, setDatabases] = useState<shareDatabase[] | []>([]);

    const filteredDBs: shareDatabase[] = databases.filter(db =>
        db.dbname.toLowerCase().includes(dbSearchQuery.toLowerCase())
    );

    const loadNetwork = async () => {
        try {
            const { data } = await axios.post("/api/network", { action: "GET_NETWORK" });
            if (data.success) {
                setConnections(data.connections);
                setProfiles(data.profiles || []);
                setMyId(data.myId);
            }
        } catch (err) {
            toast.error("Failed to load network");
        }
    };

    const fetchDatabases = async () => {
        try {
            const res = await axios.get("/api/databases");
            const data = res.data;
            const mappedDatabases = data.databases.map((db: any) => ({
                dbname: db.DatabaseName, // Convert 'DatabaseName' to 'dbname'
                db_Id: db._id || db.id   // Ensure you have a unique ID for the key
            }));

            setDatabases(mappedDatabases);
        } catch (err) {
            toast.error("Failed to fetch databases");
        }
    }

    useEffect(() => {
        loadNetwork();
        fetchDatabases();
    }, []);

    const getFriendInfo = (friendship: any) => {
        const friendId = friendship.requesterId === myId ? friendship.recipientId : friendship.requesterId;
        const profile = profiles.find(p => p.clerkId === friendId);
        return {
            username: profile?.userName || "Unknown",
            imageUrl: profile?.userImage || "",
            initials: (profile?.userName || "?").substring(0, 2).toUpperCase()
        };
    };

    const removeAccess = async (db: any) => {
        try {
            const res = await axios.post("/api/network", { action: "REVOKE_DB", friendshipId: selectedFriend._id, databaseName: db.databaseName });
            if (res.data.success) {
                toast.success("Remove Access")
                loadNetwork();
            }
        } catch (err) {
            toast.error("Failed to remove database access");
        }
    }

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length > 1) {
            const { data } = await axios.post("/api/network", { action: "SEARCH", query: val });
            setSearchResults(data.users || []);
        } else setSearchResults([]);
    };

    const sendRequest = async (targetId: string, targetUsername: string) => {
        await axios.post("/api/network", { action: "SEND_REQUEST", targetId, targetUsername });
        setSearchQuery(""); setSearchResults([]);
        toast.success("Request sent!");
        loadNetwork();
    };

    const respondRequest = async (id: string, response: "Accept" | "Reject") => {
        await axios.post("/api/network", { action: "RESPOND_REQUEST", friendshipId: id, response });
        loadNetwork();
        if (response === "Reject" && selectedFriend?._id === id) setSelectedFriend(null);
    };

    const grantAccess = async () => {
        if (!dbForm.name) return toast.error("Database name required");
        setLoading(true);
        await axios.post("/api/network", { action: "SHARE_DB", friendshipId: selectedFriend._id, databaseName: dbForm.name, role: dbForm.role, databaseId: dbForm.db_id });
        setDbForm({ name: "", role: "Viewer", db_id: "" });
        loadNetwork();
        setLoading(false);
        toast.success("Access granted");
    };

    const friends = connections.filter(c => c.status === "Accepted");
    const pending = connections.filter(c => c.status === "Pending" && c.recipientId === myId);

    // Dynamic Styles based on currentTheme
    const cardStyle = { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text };
    const inputStyle = { backgroundColor: `${currentTheme.text}08`, borderColor: currentTheme.border, color: currentTheme.text };
    const secondaryBg = { backgroundColor: `${currentTheme.text}05` };

    return (
        <div className="max-w-6xl mx-auto p-4 transition-colors duration-300" style={{ color: currentTheme.text }}>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {/* HEADER SECTION */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                    <input
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-1 ring-opacity-50 transition-all text-sm"
                        style={{ ...inputStyle }}
                        value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-60 rounded-lg border shadow-xl p-1" style={cardStyle}>
                            {searchResults.map(user => (
                                <div key={user.clerkId} className="flex items-center justify-between p-2 hover:bg-black/5 rounded transition-colors">
                                    <div className="flex items-center gap-2">
                                        {user.imageUrl ? <img src={user.imageUrl} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-blue-500/20" />}
                                        <span className="text-xs font-bold">@{user.username}</span>
                                    </div>
                                    <button onClick={() => sendRequest(user.clerkId, user.username)} style={{ color: currentTheme.primary }} className="p-1.5 rounded-md"><UserPlus size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 rounded-lg border relative transition-all" style={inputStyle}>
                        <Bell size={18} />
                        {pending.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{pending.length}</span>}
                    </button>
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-64 z-60 rounded-xl border shadow-2xl p-3" style={cardStyle}>
                                <p className="text-[10px] font-black opacity-40 uppercase mb-2">Requests</p>
                                {pending.length === 0 ? <p className="text-xs italic py-2 opacity-50">Empty</p> :
                                    pending.map(req => (
                                        <div key={req._id} className="flex items-center justify-between p-2 mb-1 rounded-lg border" style={secondaryBg}>
                                            <span className="text-xs font-bold">@{req.requesterUsername}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => respondRequest(req._id, "Accept")} className="p-1 bg-green-500 text-white rounded"><Check size={12} /></button>
                                                <button onClick={() => respondRequest(req._id, "Reject")} className="p-1 opacity-50 rounded border" style={{ borderColor: currentTheme.border }}><X size={12} /></button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: currentTheme.border }}>

                {/* SIDEBAR: FRIENDS */}
                <div className="md:col-span-4 border-r overflow-y-auto max-h-[75vh]" style={{ borderColor: currentTheme.border, ...secondaryBg }}>
                    <div className="p-3 border-b font-bold text-[10px] uppercase tracking-widest opacity-40" style={{ borderColor: currentTheme.border }}>Network</div>
                    {friends.map(f => {
                        const info = getFriendInfo(f);
                        const isActive = selectedFriend?._id === f._id;
                        return (
                            <div
                                key={f._id} onClick={() => setSelectedFriend(f)}
                                className={`p-3 cursor-pointer flex items-center justify-between border-b transition-all ${isActive ? 'shadow-inner' : ''}`}
                                style={{
                                    borderColor: currentTheme.border,
                                    backgroundColor: isActive ? currentTheme.surface : 'transparent',
                                    borderLeft: isActive ? `4px solid ${currentTheme.primary}` : '4px solid transparent'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    {info.imageUrl ? <img src={info.imageUrl} className="w-8 h-8 rounded-full border" style={{ borderColor: currentTheme.border }} /> : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={inputStyle}>{info.initials}</div>}
                                    <span className={`text-sm ${isActive ? 'font-bold' : 'opacity-80'}`}>{info.username}</span>
                                </div>
                                <ArrowRight size={14} className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                        );
                    })}
                </div>

                {/* DETAIL PANEL */}
                <div className="md:col-span-8 p-0 min-h-125 flex flex-col" style={{ backgroundColor: currentTheme.surface }}>
                    {selectedFriend ? (
                        <div className="flex-1 flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface }}>
                                <div className="flex items-center gap-3">
                                    {getFriendInfo(selectedFriend).imageUrl ?
                                        <img src={getFriendInfo(selectedFriend).imageUrl} className="w-10 h-10 rounded-full border" style={{ borderColor: currentTheme.border }} /> :
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={inputStyle}>?</div>
                                    }
                                    <div>
                                        <h2 className="text-base font-black">{getFriendInfo(selectedFriend).username}</h2>
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: currentTheme.primary }}>Connected Partner</span>
                                    </div>
                                </div>
                                <button onClick={() => { if (confirm("Remove friend?")) respondRequest(selectedFriend._id, "Reject"); }} className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                            </div>

                            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* MY SHARING SECTION */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase opacity-40 mb-3 flex items-center gap-2">
                                            <Database size={12} /> Grant New Access
                                        </h3>
                                        <div className="flex flex-col gap-2 p-3 rounded-xl border relative" style={secondaryBg}>

                                            {/* SEARCHABLE DB INPUT */}
                                            <div className="relative">
                                                <input
                                                    placeholder="Search your databases..."
                                                    className="w-full p-2 text-xs border rounded-lg outline-none"
                                                    style={inputStyle}
                                                    value={dbSearchQuery}
                                                    onFocus={() => setShowDbDropdown(true)}
                                                    onChange={(e) => {
                                                        setDbSearchQuery(e.target.value);
                                                        setDbForm({ ...dbForm, name: e.target.value });
                                                    }}
                                                />

                                                {/* DROPDOWN LIST */}
                                                <AnimatePresence>
                                                    {showDbDropdown && dbSearchQuery && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                            className="absolute z-50 w-full mt-1 border rounded-lg shadow-xl max-h-40 overflow-y-auto"
                                                            style={cardStyle}
                                                        >
                                                            {filteredDBs.length > 0 ? filteredDBs.map(db => (
                                                                <div
                                                                    key={db.dbname}
                                                                    onClick={() => {
                                                                        setDbForm({ ...dbForm, name: db.dbname, db_id: db.db_Id });
                                                                        setDbSearchQuery(db.dbname);
                                                                        setShowDbDropdown(false);
                                                                    }}
                                                                    className="p-2 text-xs cursor-pointer hover:bg-black/5 transition-colors"
                                                                >
                                                                    {db.dbname}
                                                                </div>
                                                            )) : (
                                                                <div className="p-2 text-xs opacity-50">No database found</div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* ROLE SELECT */}
                                            <select
                                                className="p-2 text-xs border rounded-lg outline-none cursor-pointer"
                                                style={inputStyle}
                                                value={dbForm.role}
                                                onChange={e => setDbForm({ ...dbForm, role: e.target.value })}
                                            >
                                                <option value="Viewer">Viewer</option>
                                                <option value="Editor">Editor</option>
                                                <option value="Admin">Admin</option>
                                            </select>

                                            <button
                                                onClick={grantAccess}
                                                className="py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
                                                style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
                                            >
                                                {loading ? "loading..." : "Grant Access"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold opacity-30 px-1 mb-2 tracking-widest uppercase">My Shares</p>
                                        {(selectedFriend.requesterId === myId ? selectedFriend.requesterSharedDBs : selectedFriend.recipientSharedDBs).map((db: any) => (
                                            <div key={db._id} className="flex justify-between items-center p-3 rounded-xl border" style={secondaryBg}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold">{db.databaseName}</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}>{db.role}</span>
                                                </div>
                                                <button onClick={() => removeAccess(db)} className="opacity-30 hover:opacity-100 hover:text-red-500"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* THEIR SHARING SECTION */}
                                <div className="space-y-4 lg:border-l lg:pl-8" style={{ borderColor: currentTheme.border }}>
                                    <h3 className="text-[10px] font-black uppercase mb-3 opacity-40 flex items-center gap-2">Received Access</h3>
                                    <div className="space-y-2">
                                        {(selectedFriend.requesterId === myId ? selectedFriend.recipientSharedDBs : selectedFriend.requesterSharedDBs).map((db: any) => (
                                            <div key={db._id} className="p-3 rounded-xl border flex flex-col gap-1" style={{ backgroundColor: `${currentTheme.primary}05`, borderColor: `${currentTheme.primary}20` }}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold">{db.databaseName}</span>
                                                    <span className="text-[9px] font-black uppercase opacity-60">{db.role}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] opacity-40 font-medium"><Check size={10} /> Authenticated</div>
                                            </div>
                                        ))}
                                        {(selectedFriend.requesterId === myId ? selectedFriend.recipientSharedDBs : selectedFriend.requesterSharedDBs).length === 0 && (
                                            <div className="p-8 text-center border-2 border-dashed rounded-2xl opacity-20" style={{ borderColor: currentTheme.border }}>
                                                <Mail size={24} className="mx-auto mb-2" />
                                                <p className="text-xs italic">Awaiting shares</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center">
                            <Users size={40} className="mb-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest">P2P Network</h3>
                            <p className="text-[10px] max-w-45 mt-2 leading-relaxed uppercase font-bold">Select a user from the list to manage shared data permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}