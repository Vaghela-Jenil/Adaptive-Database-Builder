import { motion } from "motion/react";
import {
  Plus,
  Database as DatabaseIcon,
  Lock,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  FolderOpen,
  Search,
  EyeOff,
  FolderLock,
  User,
  Calendar,
  ShieldCheck,
  Folder
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState, useMemo } from "react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { DatabaseFolder, FieldAttributes, SharedDatabaseFolder } from "../../DatabaseBuilder/types";
import axios from "axios";
import { DatabaseCardSkeleton } from "@/components/Loaders";
import { FORM_TEMPLATES } from "@/components/DatabaseBuilder/DefaultDatabaseTemplate";

type DatabasePageProps = {
  onChangePage: (changePage: string) => void;
  onEditDatabase: (database: DatabaseFolder) => void;
  onViewDatabase: (database: DatabaseFolder, userRole?: "Admin" | "Editor" | "Viewer") => void;
  onSelectTemplate?: (tempalates: FieldAttributes[] | null) => void;
};

const DatabaseTypes = ['all', 'public', 'secure', 'shared'] as const;
type DBType = typeof DatabaseTypes[number];

export default function Database({
  onChangePage,
  onEditDatabase,
  onViewDatabase,
  onSelectTemplate
}: DatabasePageProps) {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [databases, setDatabases] = useState<DatabaseFolder[]>([]);
  const [passwordModal, setPasswordModal] = useState<{
    databaseId: string;
    action: string;
  } | null>(null);

  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [newDbPassword, setNewDbPassword] = useState("");
  const [confirmNewDbPassword, setConfirmNewDbPassword] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetInfoMessage, setResetInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sharedDatabases, setSharedDatabases] = useState<DatabaseFolder[]>([]);
  const [isSharedDatbases, setIsSharedDatbases] = useState(false);
  const [sharedMeta, setSharedMeta] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<DBType>('all');

  const filteredDatabases = useMemo(() => {
    let baseList: DatabaseFolder[] = [];
      setIsSharedDatbases(false);
    if (activeTab === 'all') {
      setIsSharedDatbases(true);
      baseList = [...databases, ...sharedDatabases];
    } else if (activeTab === 'shared') {
      setIsSharedDatbases(true);
      // baseList = [...sharedDatabases];
    } else if (activeTab === 'public') {
      baseList = databases.filter((db) => !db.hasPassword);
    } else if (activeTab === 'secure') {
      baseList = databases.filter((db) => db.hasPassword);
    }

    // 2. Then, apply the search filter to the selected category
    return baseList.filter((db) =>
      db.DatabaseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, databases, sharedDatabases]);

  const handleTemplateClick = (templateKey: string) => {
    const schema = FORM_TEMPLATES[templateKey];
    if (onSelectTemplate) {
      onSelectTemplate(schema);
    }
    onChangePage("form-builder");
  };

  const handleEditDatabase = async (id: string) => {
    try {
      const verify = await axios.post(`/api/databases/${id}/verify`, {
        password: passwordInput,
      });

      if (verify.data.verified) {
        onEditDatabase([...databases, ...sharedDatabases].find((db) => db._id === id)!);
        resetPasswordModalState();
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (err) {
      alert("Access failed");
    }
  };

  const handleDeleteDatabase = async (id: string) => {
    try {
      const res = await axios.post(`/api/databases/${id}/verify`, {
        password: passwordInput,
      });
      if (!res.data.verified) {
        setPasswordError("Incorrect password");
        return;
      }
      await axios.delete(`/api/databases/${id}`);
      resetPasswordModalState();
      fetchDatabases();
    } catch (err) {
      throw new Error("Failed to delete database");
    }
  };

  const handleSetPassword = async (id: string) => {
    const password = prompt("Enter password for this database:");
    if (password) {
      await axios.post(`/api/databases/${id}/set-password`, { password });
    }
  };

  const getSharedRole = (id: string): "Admin" | "Editor" | "Viewer" | undefined => {
    const sharedIndex = sharedDatabases.findIndex((db) => db._id === id);
    if (sharedIndex >= 0 && sharedMeta[sharedIndex]) {
      return sharedMeta[sharedIndex].userRole;
    }
    return undefined;
  };

  const handleViewDatabase = async (id: string) => {
    try {
      const verify = await axios.post(`/api/databases/${id}/verify`, {
        password: passwordInput,
      });

      if (verify.data.verified) {
        const db = [...databases, ...sharedDatabases].find((db) => db._id === id)!;
        onViewDatabase(db, getSharedRole(id));
        resetPasswordModalState();
      } else {
        setPasswordError("Incorrect password!");
      }
    } catch (err) {
      alert("Access failed");
    }
  };

  const handleVerifyDatabase = async (id: string, func: string) => {
    try {
      const res = await axios.post(`/api/databases/${id}/verify`, {
        password: "",
      });
      if (!res.data.hasPassword) {
        if (func === "view") {
          const db = [...databases, ...sharedDatabases].find((db) => db._id === id)!;
          onViewDatabase(db, getSharedRole(id));
        } else if (func === "edit") {
          onEditDatabase([...databases, ...sharedDatabases].find((db) => db._id === id)!);
        } else if (func === "delete") {
          await axios.delete(`/api/databases/${id}`);
          fetchDatabases();
        }
      } else {
        setForgotPasswordMode(false);
        setOtpInput("");
        setNewDbPassword("");
        setConfirmNewDbPassword("");
        setResetInfoMessage("");
        setPasswordError("");
        setPasswordModal({ databaseId: id, action: func });
      }
    } catch (err) {
      throw new Error("Failed to verify database");
    }
  };

  const fetchDatabases = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/databases");
      const data = res.data;
      setDatabases(data.databases);
      console.log("Fetched databases:", data.databases);
    } catch (err) {
      throw new Error("Failed to fetch databases");
    } finally {
      setIsLoading(false);
    }
  }

  const resetPasswordModalState = () => {
    setPasswordModal(null);
    setPasswordInput("");
    setPasswordError("");
    setShowPassword(false);
    setForgotPasswordMode(false);
    setOtpInput("");
    setNewDbPassword("");
    setConfirmNewDbPassword("");
    setResetInfoMessage("");
    setIsSendingOtp(false);
    setIsResettingPassword(false);
  };

  const handleRequestForgotPasswordOtp = async () => {
    if (!passwordModal?.databaseId) return;

    setIsSendingOtp(true);
    setPasswordError("");
    setResetInfoMessage("");

    try {
      const response = await axios.post(`/api/databases/${passwordModal.databaseId}/forgot-password/send-otp`);
      setForgotPasswordMode(true);
      setResetInfoMessage(response.data?.message || "OTP sent. It is valid for 5 minutes.");
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to send OTP";
      setPasswordError(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetDatabasePassword = async () => {
    if (!passwordModal?.databaseId) return;

    setPasswordError("");
    setResetInfoMessage("");

    if (!otpInput.trim()) {
      setPasswordError("Please enter OTP");
      return;
    }

    if (newDbPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newDbPassword !== confirmNewDbPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await axios.post(`/api/databases/${passwordModal.databaseId}/forgot-password/reset`, {
        otp: otpInput.trim(),
        newPassword: newDbPassword,
      });

      setResetInfoMessage(response.data?.message || "Password reset successfully");

      setForgotPasswordMode(false);
      setOtpInput("");
      setNewDbPassword("");
      setConfirmNewDbPassword("");

      await fetchDatabases();
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to reset password";
      setPasswordError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const fetchShared = async () => {
    try {
      const response = await fetch('/api/network/shared-dbs');
      const data = await response.json();

      if (data.databases) {
        // Extracting only the DatabaseFolder part
        setSharedDatabases(data.databases.map((d: any) => d.details));
        setSharedMeta(data.databases.map((d: any) => d.network));
      }
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    fetchDatabases();
    fetchShared();
  }, []);


  return (
    <div className="p-8"
      onClick={() => setActiveMenu(null)}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: currentTheme.text }}
          >
            My Databases
          </h1>
          <p style={{ color: currentTheme.textSecondary }}>
            Create, manage, and organize your custom databases
          </p>
        </div>

        <Button
          onClick={() => {
            if (onSelectTemplate) onSelectTemplate([]);
            onChangePage("form-builder");
          }}
          className="flex items-center gap-2"
          style={{
            backgroundColor: currentTheme.primary,
            color: "#ffffff",
          }}
        >
          <Plus className="w-5 h-5" />
          Create New Database
        </Button>
      </div>

      {/* 3. NEW QUICK TEMPLATES SECTION */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: currentTheme.textSecondary }}>
          Quick Templates
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {Object.keys(FORM_TEMPLATES).map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleTemplateClick(key)}
              className="capitalize rounded-full border-dashed"
              style={{
                color: currentTheme.text,
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.surface
              }}
            >
              <Plus className="w-3 h-3 mr-2" />
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
          style={{ color: currentTheme.textSecondary }}
        />
        <Input
          type="text"
          placeholder="Search databases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      </div>

      <div
        className="flex items-center p-1 rounded-xl w-fit mb-3"
        style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
      >
        {DatabaseTypes.map((type) => {
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className="relative px-6 py-2 text-sm font-medium capitalize transition-colors duration-300 outline-none"
              style={{ color: isActive ? currentTheme.text : currentTheme.textSecondary }}
            >
              {/* Animated background pill for active state */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-lg shadow-md"
                  style={{ backgroundColor: currentTheme.primary }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Label - Z-index 10 to stay above the animated pill */}
              <span className="relative z-10">{type}</span>
            </button>
          );
        })}
      </div>

      {/* Database Grid */}
      {isLoading ?
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(8)].map((_, i) => (
            <DatabaseCardSkeleton key={i} />
          ))}
        </div>

        : filteredDatabases.length === 0 && sharedDatabases.length === 0 ? (
          <Card
            className="p-12 text-center"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <FolderOpen
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: currentTheme.textSecondary }}
            />
            <h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.text }}>
              {searchQuery ? "No databases found" : "No databases yet"}
            </h3>
            <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
              {searchQuery
                ? "Try a different search term"
                : "Create your first database to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => onChangePage("form-builder")}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: "#ffffff",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Database
              </Button>
            )}
          </Card>
        ) : activeTab !== 'shared' && (
          <div>
          <div className="w-full py-3 mt-8">
            <div className="flex items-center">
              <Folder
                className="w-6 h-6"
                style={{ color: currentTheme.text }}
              />
              <span className="ml-4 font-semibold text-lg" style={{ color: currentTheme.text }}>
                {activeTab} Databases
              </span>
            </div>
            <hr className="mt-3 border-t" style={{ borderColor: currentTheme.text, opacity: 0.1 }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredDatabases.map((database) => (
              <motion.div
                key={database._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <Card
                  className="p-6 relative cursor-pointer h-full flex flex-col justify-between transition-all duration-300"
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                  onClick={() => handleVerifyDatabase(database._id, 'view')}
                >
                  {/* Header with icon and menu */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      <DatabaseIcon className="w-5 h-5 text-white" />
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === database._id ? null : database._id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                        }}
                      >
                        <MoreVertical className="w-4 h-4" style={{ color: currentTheme.text }} />
                      </button>

                      {activeMenu === database._id && (
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-10 py-2"
                          style={{
                            backgroundColor: currentTheme.surface,
                            border: `1px solid ${currentTheme.border}`,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyDatabase(database._id, 'view');
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-opacity-50"
                            style={{ color: currentTheme.text }}
                          >
                            <Eye className="w-4 h-4" />
                            View Database
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyDatabase(database._id, 'edit');
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2"
                            style={{ color: currentTheme.text }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit Form
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPassword(database._id);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2"
                            style={{ color: currentTheme.text }}
                          >
                            <Lock className="w-4 h-4" />
                            {database.hasPassword ? "Change Password" : "Set Password"}
                          </button>
                          <div
                            className="my-1 h-px mx-2"
                            style={{ backgroundColor: currentTheme.border }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyDatabase(database._id, 'delete');
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Database Name */}
                  <h3 className="font-bold truncate mb-1" style={{ color: currentTheme.text }}>
                    {database.DatabaseName}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                      {database.recordCount} records
                    </span>
                    {database.hasPassword && (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" style={{ color: currentTheme.primary }} />
                        <span className="text-xs" style={{ color: currentTheme.primary }}>
                          Protected
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: currentTheme.border }}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase opacity-50" style={{ color: currentTheme.text }}>Created</span>
                      <span className="text-xs font-medium" style={{ color: currentTheme.textSecondary }}>
                        {new Date(database.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase opacity-50" style={{ color: currentTheme.text }}>Updated</span>
                      <span className="text-xs font-medium" style={{ color: currentTheme.primary }}>
                        {new Date(database.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          </div>
        )}


      {/* SHARED DATABASES SECTION */}
      {!searchQuery && isSharedDatbases && sharedDatabases.length !== 0 && (
        <>
          <div className="w-full py-3 mt-8">
            <div className="flex items-center">
              <FolderLock
                className="w-6 h-6"
                style={{ color: currentTheme.text }}
              />
              <span className="ml-4 font-semibold text-lg" style={{ color: currentTheme.text }}>
                Shared Databases
              </span>
            </div>
            <hr className="mt-3 border-t" style={{ borderColor: currentTheme.text, opacity: 0.1 }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sharedDatabases.map((database: DatabaseFolder, index: number) => {
              const meta = sharedMeta[index];

              return (
                <motion.div
                  key={database._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Card
                    className="p-6 relative cursor-pointer h-full flex flex-col justify-between transition-all duration-300"
                    style={{
                      backgroundColor: currentTheme.surface,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                    onClick={() => handleVerifyDatabase(database._id, 'view')}
                  >
                    {/* Header with Icon and Action Menu */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <DatabaseIcon className="w-5 h-5 text-white" />
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === database._id ? null : database._id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{
                            backgroundColor: currentTheme.background,
                            border: `1px solid ${currentTheme.border}`,
                          }}
                        >
                          <MoreVertical className="w-4 h-4" style={{ color: currentTheme.text }} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === database._id && (
                          <div
                            className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-10 py-2"
                            style={{
                              backgroundColor: currentTheme.surface,
                              border: `1px solid ${currentTheme.border}`,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyDatabase(database._id, 'view');
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-opacity-50"
                              style={{ color: currentTheme.text }}
                            >
                              <Eye className="w-4 h-4" />
                              View Database
                            </button>

                            {/* Show Edit only if role is Admin or Editor */}
                            {meta?.userRole !== "Viewer" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyDatabase(database._id, 'edit');
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2"
                                style={{ color: currentTheme.text }}
                              >
                                <Edit className="w-4 h-4" />
                                Edit Form
                              </button>
                            )}

                            <div
                              className="my-1 h-px mx-2"
                              style={{ backgroundColor: currentTheme.border }}
                            />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Logic for removing shared access would go here
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2"
                              style={{ color: "#ef4444" }}
                            >
                              <EyeOff className="w-4 h-4" />
                              Hide Shared
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Database Identity */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold truncate text-sm" style={{ color: currentTheme.text }}>
                          {database.DatabaseName}
                        </h3>
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase"
                          style={{
                            backgroundColor: `${currentTheme.primary}20`,
                            color: currentTheme.primary
                          }}
                        >
                          {meta?.userRole}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-60 flex items-center gap-1" style={{ color: currentTheme.textSecondary }}>
                        <User className="w-3 h-3" /> Shared by @{meta?.ownerName}
                      </p>
                    </div>

                    {/* Footer Stats & Dates */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: currentTheme.border }}>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase opacity-50 font-bold" style={{ color: currentTheme.text }}>
                          Granted
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: currentTheme.textSecondary }}>
                          {meta?.grantedAt ? new Date(meta.grantedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase opacity-50 font-bold" style={{ color: currentTheme.text }}>
                          Records
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: currentTheme.primary }}>
                          {database.recordCount}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {passwordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div
            className="w-95 rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: currentTheme.text, }}>
              {forgotPasswordMode ? "Reset Database Password" : "Enter Database Password"}
            </h2>

            {!forgotPasswordMode ? (
              <>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg outline-none transition"
                    style={{
                      backgroundColor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text,
                    }}
                    placeholder="Enter password"
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="mb-3 text-right">
                  <button
                    type="button"
                    className="text-sm font-medium underline"
                    style={{ color: currentTheme.primary }}
                    disabled={isSendingOtp}
                    onClick={handleRequestForgotPasswordOtp}
                  >
                    {isSendingOtp ? "Sending OTP..." : "Forgot Password?"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 mb-3">
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  Enter OTP sent to your Gmail. OTP is valid for 5 minutes.
                </p>

                <Input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />

                <Input
                  type="password"
                  value={newDbPassword}
                  onChange={(e) => setNewDbPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />

                <Input
                  type="password"
                  value={confirmNewDbPassword}
                  onChange={(e) => setConfirmNewDbPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    className="text-sm font-medium underline"
                    style={{ color: currentTheme.primary }}
                    disabled={isSendingOtp}
                    onClick={handleRequestForgotPasswordOtp}
                  >
                    {isSendingOtp ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

            {passwordError && (
              <p className="text-red-500 text-sm mb-3">{passwordError}</p>
            )}

            {resetInfoMessage && (
              <p className="text-emerald-500 text-sm mb-3">{resetInfoMessage}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={resetPasswordModalState}
                className="px-4 py-2 rounded-lg"
                style={{ border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}
              >
                Cancel
              </button>

              {!forgotPasswordMode ? (
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                  onClick={() => {
                    if (passwordModal.action === "view") {
                      handleViewDatabase(passwordModal.databaseId);
                    } else if (passwordModal.action === "edit") {
                      handleEditDatabase(passwordModal.databaseId);
                    } else if (passwordModal.action === "delete") {
                      handleDeleteDatabase(passwordModal.databaseId);
                    }
                  }}
                >
                  {passwordModal.action} Database
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                  disabled={isResettingPassword}
                  onClick={handleResetDatabasePassword}
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
