'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, UserPlus, Check, X, Database, Trash2,
    Bell, Users, Share2, Shield, Eye, Edit3,
    ChevronDown, Inbox, Globe, Lock, Sparkles,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";

interface ShareDatabase {
    dbname: string;
    db_Id: string;
}

type RoleType = "Viewer" | "Editor" | "Admin";

interface EditRoleModalState {
    friendshipId: string;
    databaseId?: string;
    databaseName: string;
    role: RoleType;
}

type ActiveTab = "connections" | "requests";

export default function ThemedNetwork() {
    const { currentTheme } = useTheme();

    const [myId, setMyId] = useState("");
    const [connections, setConnections] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<ActiveTab>("connections");
    const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
    const [shareModalFriend, setShareModalFriend] = useState<any | null>(null);

    const [dbForm, setDbForm] = useState({ name: "", db_id: "", role: "Viewer" });
    const [loading, setLoading] = useState(false);
    const [dbSearchQuery, setDbSearchQuery] = useState("");
    const [showDbDropdown, setShowDbDropdown] = useState(false);
    const [databases, setDatabases] = useState<ShareDatabase[]>([]);
    const [editRoleModal, setEditRoleModal] = useState<EditRoleModalState | null>(null);
    const [updatingRole, setUpdatingRole] = useState(false);

    // Real-time notification state
    const prevReceivedCountRef = useRef<number>(0);
    const isInitialLoadRef = useRef(true);

    const getMySharedDBs = useCallback((friendship: any) => {
        if (!friendship) return [];
        return friendship.requesterId === myId
            ? (friendship.requesterSharedDBs || [])
            : (friendship.recipientSharedDBs || []);
    }, [myId]);

    const alreadySharedById = new Set(
        getMySharedDBs(shareModalFriend)
            .map((db: any) => db.databaseId)
            .filter(Boolean)
    );

    const alreadySharedByName = new Set(
        getMySharedDBs(shareModalFriend)
            .map((db: any) => (db.databaseName || "").toLowerCase())
    );

    const filteredDBs: ShareDatabase[] = databases.filter(db => {
        const matchesQuery = db.dbname.toLowerCase().includes(dbSearchQuery.toLowerCase());
        const alreadyShared = alreadySharedById.has(db.db_Id) || alreadySharedByName.has(db.dbname.toLowerCase());
        return matchesQuery && !alreadyShared;
    });

    const loadNetwork = useCallback(async () => {
        try {
            const { data } = await axios.post("/api/network", { action: "GET_NETWORK" });
            if (data.success) {
                setConnections(data.connections);
                setProfiles(data.profiles || []);
                setMyId(data.myId);
                return data;
            }
        } catch {
            toast.error("Failed to load network");
        }
        return null;
    }, []);

    const fetchDatabases = async () => {
        try {
            const res = await axios.get("/api/databases");
            const mappedDatabases = res.data.databases.map((db: any) => ({
                dbname: db.DatabaseName,
                db_Id: db._id || db.id
            }));
            setDatabases(mappedDatabases);
        } catch {
            toast.error("Failed to fetch databases");
        }
    };

    // Count total received shared DBs for the current user
    const countReceivedDBs = useCallback((conns: any[], userId: string) => {
        let count = 0;
        conns.filter(c => c.status === "Accepted").forEach(c => {
            const list = c.requesterId === userId ? c.recipientSharedDBs : c.requesterSharedDBs;
            count += (list?.length || 0);
        });
        return count;
    }, []);

    // Polling for real-time grant access notifications
    useEffect(() => {
        loadNetwork().then(data => {
            if (data) {
                const count = countReceivedDBs(data.connections, data.myId);
                prevReceivedCountRef.current = count;
                isInitialLoadRef.current = false;
            }
        });
        fetchDatabases();

        const interval = setInterval(async () => {
            try {
                const { data } = await axios.post("/api/network", { action: "GET_NETWORK" });
                if (data.success) {
                    setConnections(data.connections);
                    setProfiles(data.profiles || []);
                    setMyId(data.myId);

                    if (!isInitialLoadRef.current) {
                        const newCount = countReceivedDBs(data.connections, data.myId);
                        if (newCount > prevReceivedCountRef.current) {
                            const diff = newCount - prevReceivedCountRef.current;
                            toast.info(`${diff} new database${diff > 1 ? 's' : ''} shared with you!`, {
                                icon: <Sparkles size={16} />,
                            });
                        }
                        prevReceivedCountRef.current = newCount;
                    }
                }
            } catch { /* silent polling failure */ }
        }, 5000);

        return () => clearInterval(interval);
    }, [loadNetwork, countReceivedDBs]);

    const getFriendInfo = (friendship: any) => {
        const friendId = friendship.requesterId === myId ? friendship.recipientId : friendship.requesterId;
        const profile = profiles.find(p => p.clerkId === friendId);
        return {
            username: profile?.userName || "Unknown",
            imageUrl: profile?.userImage || "",
            initials: (profile?.userName || "?").substring(0, 2).toUpperCase()
        };
    };

    const removeAccess = async (friendshipId: string, db: any) => {
        try {
            const res = await axios.post("/api/network", { action: "REVOKE_DB", friendshipId, databaseName: db.databaseName });
            if (res.data.success) {
                toast.success("Access removed");
                loadNetwork();
            }
        } catch {
            toast.error("Failed to remove database access");
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        // Clear search results immediately if input is empty
        if (val.trim().length === 0) {
            setSearchResults([]);
            return;
        }
        // Only search if query is longer than 1 character
        if (val.trim().length > 1) {
            try {
                const { data } = await axios.post("/api/network", { action: "SEARCH", query: val });
                // Filter out already connected friends and pending requests
                const filteredUsers = (data.users || []).filter((user: any) => {
                    // Check if user is already connected
                    const isConnected = connections.some(c => 
                        (c.requesterId === user.clerkId || c.recipientId === user.clerkId) && 
                        c.status === "Accepted"
                    );
                    // Check if request is already pending
                    const hasPending = connections.some(c => 
                        (c.requesterId === user.clerkId || c.recipientId === user.clerkId) && 
                        c.status === "Pending"
                    );
                    return !isConnected && !hasPending;
                });
                setSearchResults(filteredUsers);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            }
        } else {
            // Clear results if query is 1 character or less
            setSearchResults([]);
        }
    };

    const sendRequest = async (targetId: string, targetUsername: string) => {
        try {
            // Check if request already exists
            const hasExistingRequest = connections.some(c => 
                (c.requesterId === targetId || c.recipientId === targetId)
            );
            if (hasExistingRequest) {
                toast.info("Request already sent or connection exists with this user");
                return;
            }
            await axios.post("/api/network", { action: "SEND_REQUEST", targetId, targetUsername });
            setSearchQuery("");
            setSearchResults([]);
            toast.success("Request sent!");
            loadNetwork();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message;
            if (errorMsg?.includes("already") || errorMsg?.includes("pending")) {
                toast.info("Request already sent or connection exists");
            } else {
                toast.error("Failed to send request");
            }
        }
    };

    const respondRequest = async (id: string, response: "Accept" | "Reject") => {
        await axios.post("/api/network", { action: "RESPOND_REQUEST", friendshipId: id, response });
        loadNetwork();
    };

    const grantAccess = async () => {
        if (!dbForm.name || !shareModalFriend) return toast.error("Select a database first");

        const alreadyShared = getMySharedDBs(shareModalFriend).some((db: any) =>
            (db.databaseId && db.databaseId === dbForm.db_id) ||
            (db.databaseName || "").toLowerCase() === dbForm.name.toLowerCase()
        );

        if (alreadyShared) {
            return toast.info("This database is already shared with this connection");
        }

        setLoading(true);
        try {
            await axios.post("/api/network", {
                action: "SHARE_DB",
                friendshipId: shareModalFriend._id,
                databaseName: dbForm.name,
                role: dbForm.role,
                databaseId: dbForm.db_id
            });
            setDbForm({ name: "", role: "Viewer", db_id: "" });
            setDbSearchQuery("");
            loadNetwork();
            toast.success("Access granted!");
        } catch {
            toast.error("Failed to grant access");
        }
        setLoading(false);
    };

    const updateSharedRole = async () => {
        if (!editRoleModal) return;
        setUpdatingRole(true);
        try {
            await axios.post("/api/network", {
                action: "UPDATE_DB_ROLE",
                friendshipId: editRoleModal.friendshipId,
                databaseName: editRoleModal.databaseName,
                databaseId: editRoleModal.databaseId,
                role: editRoleModal.role,
            });
            toast.success("Role updated");
            setEditRoleModal(null);
            loadNetwork();
        } catch {
            toast.error("Failed to update role");
        }
        setUpdatingRole(false);
    };

    const friends = connections.filter(c => c.status === "Accepted");
    const pending = connections.filter(c => c.status === "Pending" && c.recipientId === myId);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "Admin": return <Shield size={11} />;
            case "Editor": return <Edit3 size={11} />;
            default: return <Eye size={11} />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "Admin": return "#ef4444";
            case "Editor": return "#f59e0b";
            default: return currentTheme.primary;
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 transition-colors duration-300" style={{ color: currentTheme.text }}>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover theme="dark" />

            {/* TOP BAR */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Network</h1>
                        <p className="text-xs mt-0.5" style={{ color: currentTheme.textSecondary }}>
                            {friends.length} connection{friends.length !== 1 ? 's' : ''} &middot; {pending.length} pending
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {pending.length > 0 && (
                            <button
                                onClick={() => setActiveTab("requests")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                            >
                                <Bell size={13} /> {pending.length} Request{pending.length > 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                </div>

                {/* SEARCH */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: currentTheme.textSecondary }} />
                    <input
                        placeholder="Search users to connect..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none text-sm transition-all"
                        style={{ backgroundColor: `${currentTheme.text}08`, color: currentTheme.text }}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl shadow-2xl overflow-hidden border"
                                style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
                            >
                                {searchResults.map(user => (
                                    <div key={user.clerkId} className="flex items-center justify-between px-4 py-3 transition-colors hover:brightness-95" style={{ backgroundColor: currentTheme.surface }}>
                                        <div className="flex items-center gap-3">
                                            {user.imageUrl
                                                ? <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" style={{ border: `2px solid ${currentTheme.border}` }} alt="" />
                                                : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}>{user.username?.substring(0, 2).toUpperCase()}</div>
                                            }
                                            <div>
                                                <p className="text-sm font-semibold">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => sendRequest(user.clerkId, user.username)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                                            style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
                                        >
                                            <UserPlus size={12} /> Add
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ backgroundColor: `${currentTheme.text}06` }}>
                {(["connections", "requests"] as ActiveTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                        style={{
                            backgroundColor: activeTab === tab ? currentTheme.surface : 'transparent',
                            color: activeTab === tab ? currentTheme.text : currentTheme.textSecondary,
                            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {tab === "connections" ? `Connections (${friends.length})` : `Requests (${pending.length})`}
                    </button>
                ))}
            </div>

            {/* CONNECTIONS TAB */}
            <AnimatePresence mode="wait">
                {activeTab === "connections" && (
                    <motion.div
                        key="connections"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                    >
                        {friends.length === 0 && (
                            <div className="flex flex-col items-center py-20 opacity-30">
                                <Globe size={48} className="mb-3" />
                                <p className="text-sm font-bold">No connections yet</p>
                                <p className="text-xs mt-1">Search for users above to get started</p>
                            </div>
                        )}

                        {friends.map(f => {
                            const info = getFriendInfo(f);
                            const isExpanded = expandedFriendId === f._id;
                            const myShares = f.requesterId === myId ? f.requesterSharedDBs : f.recipientSharedDBs;
                            const theirShares = f.requesterId === myId ? f.recipientSharedDBs : f.requesterSharedDBs;

                            return (
                                <motion.div
                                    key={f._id}
                                    layout
                                    className="rounded-2xl border overflow-hidden transition-shadow"
                                    style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface }}
                                >
                                    {/* Friend Row */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                                        onClick={() => setExpandedFriendId(isExpanded ? null : f._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {info.imageUrl
                                                ? <img src={info.imageUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}>{info.initials}</div>
                                            }
                                            <div>
                                                <p className="text-sm font-bold">{info.username}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {myShares.length > 0 && (
                                                        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: currentTheme.textSecondary }}>
                                                            <Share2 size={10} /> {myShares.length} shared
                                                        </span>
                                                    )}
                                                    {theirShares.length > 0 && (
                                                        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: currentTheme.primary }}>
                                                            <Inbox size={10} /> {theirShares.length} received
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShareModalFriend(f);
                                                    setDbSearchQuery("");
                                                    setShowDbDropdown(false);
                                                    setDbForm({ name: "", db_id: "", role: "Viewer" });
                                                }}
                                                className="p-2 rounded-lg transition-all active:scale-90"
                                                style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary }}
                                                title="Share database"
                                            >
                                                <Share2 size={15} />
                                            </button>
                                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronDown size={16} style={{ color: currentTheme.textSecondary }} />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: currentTheme.border }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                        {/* My Shares */}
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: currentTheme.textSecondary }}>
                                                                <Share2 size={10} /> Databases I Shared
                                                            </p>
                                                            {myShares.length === 0 ? (
                                                                <p className="text-xs py-3 text-center rounded-xl border border-dashed" style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}>
                                                                    No databases shared yet
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    {myShares.map((db: any) => (
                                                                        <div key={db._id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: `${currentTheme.text}04` }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <Database size={12} style={{ color: currentTheme.textSecondary }} />
                                                                                <span className="text-xs font-semibold">{db.databaseName}</span>
                                                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase" style={{ backgroundColor: `${getRoleColor(db.role)}15`, color: getRoleColor(db.role) }}>
                                                                                    {getRoleIcon(db.role)} {db.role}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setEditRoleModal({
                                                                                    friendshipId: f._id,
                                                                                    databaseId: db.databaseId,
                                                                                    databaseName: db.databaseName,
                                                                                    role: (db.role || "Viewer") as RoleType,
                                                                                })}
                                                                                className="p-1 rounded-md transition-all hover:scale-110"
                                                                                style={{ color: currentTheme.textSecondary }}
                                                                                title="Edit role"
                                                                            >
                                                                                <Edit3 size={13} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => removeAccess(f._id, db)}
                                                                                className="p-1 rounded-md transition-all hover:scale-110"
                                                                                style={{ color: currentTheme.textSecondary }}
                                                                                title="Revoke access"
                                                                            >
                                                                                <X size={13} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Received */}
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: currentTheme.textSecondary }}>
                                                                <Inbox size={10} /> Databases Shared With Me
                                                            </p>
                                                            {theirShares.length === 0 ? (
                                                                <p className="text-xs py-3 text-center rounded-xl border border-dashed" style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}>
                                                                    No databases received
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    {theirShares.map((db: any) => (
                                                                        <div key={db._id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}06` }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <Lock size={12} style={{ color: currentTheme.primary }} />
                                                                                <span className="text-xs font-semibold">{db.databaseName}</span>
                                                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase" style={{ backgroundColor: `${getRoleColor(db.role)}15`, color: getRoleColor(db.role) }}>
                                                                                    {getRoleIcon(db.role)} {db.role}
                                                                                </span>
                                                                            </div>
                                                                            <Check size={13} style={{ color: currentTheme.primary }} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex justify-end mt-4 pt-3 border-t" style={{ borderColor: currentTheme.border }}>
                                                        <button
                                                            onClick={() => { if (confirm("Remove this connection? All shared access will be lost.")) respondRequest(f._id, "Reject"); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-90"
                                                            style={{ backgroundColor: '#ef444412', color: '#ef4444' }}
                                                        >
                                                            <Trash2 size={12} /> Remove Connection
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* REQUESTS TAB */}
                {activeTab === "requests" && (
                    <motion.div
                        key="requests"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-3"
                    >
                        {pending.length === 0 && (
                            <div className="flex flex-col items-center py-20 opacity-30">
                                <Inbox size={48} className="mb-3" />
                                <p className="text-sm font-bold">No pending requests</p>
                                <p className="text-xs mt-1">When someone sends you a request, it&apos;ll show up here</p>
                            </div>
                        )}

                        {pending.map(req => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 rounded-2xl border"
                                style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}>
                                        {req.requesterUsername?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">@{req.requesterUsername}</p>
                                        <p className="text-[10px]" style={{ color: currentTheme.textSecondary }}>Wants to connect</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => respondRequest(req._id, "Accept")}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95"
                                        style={{ backgroundColor: '#22c55e' }}
                                    >
                                        <Check size={13} /> Accept
                                    </button>
                                    <button
                                        onClick={() => respondRequest(req._id, "Reject")}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border"
                                        style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
                                    >
                                        <X size={13} /> Decline
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SHARE DATABASE MODAL */}
            <AnimatePresence>
                {shareModalFriend && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setShareModalFriend(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden"
                            style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: currentTheme.border }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}15` }}>
                                        <Share2 size={18} style={{ color: currentTheme.primary }} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">Share Database</h3>
                                        <p className="text-[11px]" style={{ color: currentTheme.textSecondary }}>
                                            with @{getFriendInfo(shareModalFriend).username}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShareModalFriend(null)} className="p-1.5 rounded-lg transition-all" style={{ color: currentTheme.textSecondary }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                {/* DB Search */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: currentTheme.textSecondary }}>Database</label>
                                    <div className="relative">
                                        <Database className="absolute left-3 top-1/2 -translate-y-1/2" size={13} style={{ color: currentTheme.textSecondary }} />
                                        <input
                                            placeholder="Search your databases..."
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all"
                                            style={{ backgroundColor: `${currentTheme.text}05`, borderColor: currentTheme.border, color: currentTheme.text }}
                                            value={dbSearchQuery}
                                            onFocus={() => setShowDbDropdown(true)}
                                            onChange={e => { setDbSearchQuery(e.target.value); setDbForm({ ...dbForm, name: e.target.value }); }}
                                        />
                                        <AnimatePresence>
                                            {showDbDropdown && dbSearchQuery && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="absolute z-50 w-full mt-1 border rounded-xl shadow-xl max-h-40 overflow-y-auto"
                                                    style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
                                                >
                                                    {filteredDBs.length > 0 ? filteredDBs.map(db => (
                                                        <div
                                                            key={db.db_Id}
                                                            onClick={() => {
                                                                setDbForm({ ...dbForm, name: db.dbname, db_id: db.db_Id });
                                                                setDbSearchQuery(db.dbname);
                                                                setShowDbDropdown(false);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors"
                                                            style={{ color: currentTheme.text }}
                                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${currentTheme.text}08`)}
                                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        >
                                                            <Database size={12} style={{ color: currentTheme.textSecondary }} />
                                                            {db.dbname}
                                                        </div>
                                                    )) : (
                                                        <div className="px-3 py-2.5 text-xs" style={{ color: currentTheme.textSecondary }}>
                                                            No shareable database found
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: currentTheme.textSecondary }}>Permission Level</label>
                                    <div className="flex gap-2">
                                        {(["Viewer", "Editor", "Admin"] as const).map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setDbForm({ ...dbForm, role })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border"
                                                style={{
                                                    borderColor: dbForm.role === role ? getRoleColor(role) : currentTheme.border,
                                                    backgroundColor: dbForm.role === role ? `${getRoleColor(role)}12` : 'transparent',
                                                    color: dbForm.role === role ? getRoleColor(role) : currentTheme.textSecondary,
                                                }}
                                            >
                                                {getRoleIcon(role)} {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-2 p-5 pt-0">
                                <button
                                    onClick={() => setShareModalFriend(null)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                                    style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={grantAccess}
                                    disabled={loading || !dbForm.name}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
                                    style={{ backgroundColor: currentTheme.primary }}
                                >
                                    {loading ? "Granting..." : "Grant Access"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT ROLE MODAL */}
            <AnimatePresence>
                {editRoleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setEditRoleModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden"
                            style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: currentTheme.border }}>
                                <div>
                                    <h3 className="text-sm font-bold">Edit Shared Role</h3>
                                    <p className="text-[11px]" style={{ color: currentTheme.textSecondary }}>
                                        {editRoleModal.databaseName}
                                    </p>
                                </div>
                                <button onClick={() => setEditRoleModal(null)} className="p-1.5 rounded-lg transition-all" style={{ color: currentTheme.textSecondary }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5">
                                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: currentTheme.textSecondary }}>
                                    Permission Level
                                </label>
                                <div className="flex gap-2">
                                    {(["Viewer", "Editor", "Admin"] as RoleType[]).map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setEditRoleModal({ ...editRoleModal, role })}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border"
                                            style={{
                                                borderColor: editRoleModal.role === role ? getRoleColor(role) : currentTheme.border,
                                                backgroundColor: editRoleModal.role === role ? `${getRoleColor(role)}12` : 'transparent',
                                                color: editRoleModal.role === role ? getRoleColor(role) : currentTheme.textSecondary,
                                            }}
                                        >
                                            {getRoleIcon(role)} {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 p-5 pt-0">
                                <button
                                    onClick={() => setEditRoleModal(null)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                                    style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateSharedRole}
                                    disabled={updatingRole}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
                                    style={{ backgroundColor: currentTheme.primary }}
                                >
                                    {updatingRole ? "Updating..." : "Save Role"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}