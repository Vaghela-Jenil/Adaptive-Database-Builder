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
  EyeOff
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { DatabaseFolder } from "../../DatabaseBuilder/types";
import axios from "axios";

type DatabasePageProps = {
  onChangePage: (changePage: string) => void;
  onEditDatabase: (database: DatabaseFolder) => void;
  onViewDatabase: (database: DatabaseFolder) => void;
};

export default function Database({
  onChangePage,
  onEditDatabase,
  onViewDatabase,
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

  const filteredDatabases: DatabaseFolder[] = databases.filter((db) =>
    db.DatabaseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditDatabase = async (id: string) => {
    try {
      const verify = await axios.post(`/api/databases/${id}/verify`, {
        password: passwordInput,
      });

      if (verify.data.verified) {
        onEditDatabase(databases.find((db) => db._id === id)!);
        setPasswordInput("");
        setPasswordModal(null);
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
      setPasswordInput("");
      setPasswordModal(null);
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

  const handleViewDatabase = async (id: string) => {
    try {
      console.log(passwordInput);
      const verify = await axios.post(`/api/databases/${id}/verify`, {
        password: passwordInput,
      });

      if (verify.data.verified) {
        onViewDatabase(databases.find((db) => db._id === id)!);
        setPasswordInput("");
        setPasswordModal(null);
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
          onViewDatabase(databases.find((db) => db._id === id)!);
        } else if (func === "edit") {
          onEditDatabase(databases.find((db) => db._id === id)!);
        } else if (func === "delete") {
          await axios.delete(`/api/databases/${id}`);
          fetchDatabases();
        }
      } else {
        setPasswordModal({ databaseId: id, action: func });
      }
    } catch (err) {
      throw new Error("Failed to verify database");
    }
  };

  const fetchDatabases = async () => {
    try {
      const res = await axios.get("/api/databases");
      const data = res.data;
      setDatabases(data.databases);
      console.log("Fetched databases:", data.databases);
    } catch (err) {
      throw new Error("Failed to fetch databases");
    }
  }

  useEffect(() => {
    fetchDatabases();
  }, []);


  return (
    <div className="p-8">
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
          onClick={() => onChangePage("form-builder")}
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

      {/* Database Grid */}
      {filteredDatabases.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredDatabases.map((database) => (
            <motion.div
              key={database._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="p-6 relative cursor-pointer"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
                onClick={() => handleVerifyDatabase(database._id, 'view')}
              >
                {/* Header with icon and menu */}
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    <DatabaseIcon className="w-4 h-4 text-white" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === database._id ? null : database._id);
                      }}
                      className="p-1 rounded-lg hover:scale-110 transition-all"
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
                <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.text }}>
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

                {/* Created Date */}
                <div className="flex justify-between">
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Created {new Date(database.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Updated {new Date(database.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
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
            <h2 className="text-lg font-semibold mb-4">
              Enter Database Password
            </h2>

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

            {passwordError && (
              <p className="text-red-500 text-sm mb-3">{passwordError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setPasswordInput("");
                  setPasswordError("");
                  setShowPassword(false);
                }}
                className="px-4 py-2 rounded-lg"
                style={{ border: `1px solid ${currentTheme.border}` }}
              >
                Cancel
              </button>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
