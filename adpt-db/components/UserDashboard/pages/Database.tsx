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
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { FieldAttributes } from "../../DatabaseBuilder/types";

type DatabaseFolder = {
  id: string;
  name: string;
  formSchema: FieldAttributes[];
  createdAt: string;
  hasPassword: boolean;
  password?: string;
  recordCount: number;
  records: DatabaseRecord[];
};

type DatabaseRecord = {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

type DatabasePageProps = {
  onCreateNew: () => void;
  onEditForm: (database: DatabaseFolder) => void;
  onViewDatabase: (database: DatabaseFolder) => void;
  databases: DatabaseFolder[];
  onDeleteDatabase: (id: string) => void;
  onSetPassword: (id: string) => void;
};

export default function Database({
  onCreateNew,
  onEditForm,
  onViewDatabase,
  databases,
  onDeleteDatabase,
  onSetPassword,
}: DatabasePageProps) {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          onClick={onCreateNew}
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
              onClick={onCreateNew}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatabases.map((database) => (
            <motion.div
              key={database.id}
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
                onClick={() => onViewDatabase(database)}
              >
                {/* Header with icon and menu */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    <DatabaseIcon className="w-6 h-6 text-white" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === database.id ? null : database.id);
                      }}
                      className="p-2 rounded-lg hover:scale-110 transition-all"
                      style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.border}`,
                      }}
                    >
                      <MoreVertical className="w-4 h-4" style={{ color: currentTheme.text }} />
                    </button>

                    {activeMenu === database.id && (
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
                            onViewDatabase(database);
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
                            onEditForm(database);
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
                            onSetPassword(database.id);
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
                            if (confirm(`Delete "${database.name}"?`)) {
                              onDeleteDatabase(database.id);
                            }
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
                  {database.name}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
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
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  Created {new Date(database.createdAt).toLocaleDateString()}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
