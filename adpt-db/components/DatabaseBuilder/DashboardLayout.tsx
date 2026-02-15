'use client';
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import DashboardSidebar from "../UserDashboard/app-sidebar";
import DashboardNavbar from "../UserDashboard/app-navbar";
import DashboardHome from "../UserDashboard/pages/DashboardHome";
import Analytics from "../UserDashboard/pages/Analytics";
import Chatbot from "../UserDashboard/pages/chatbot";
import History from "../UserDashboard/pages/History";
import Settings from "../UserDashboard/pages/setting";
import Database from "../UserDashboard/pages/Database";
import FormBuilderPage from "./FormBuilderPage";
import DatabaseRecordsView from "./DatabaseRecordsView";
import DatabaseChatbot from "./DatabaseChatbot";
import { FieldAttributes } from "./types";
import NearByStorePage from "../UserDashboard/pages/NearbyStore";

type DatabaseRecord = {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

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

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentTheme } = useTheme();
  const [databases, setDatabases] = useState<DatabaseFolder[]>([]);
  const [editingDatabase, setEditingDatabase] = useState<DatabaseFolder | null>(null);
  const [viewingDatabase, setViewingDatabase] = useState<DatabaseFolder | null>(null);

  // Load databases from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("databases");
    if (saved) {
      try {
        setDatabases(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load databases:", e);
      }
    }
  }, []);

  // Save databases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("databases", JSON.stringify(databases));
  }, [databases]);

  const handleCreateDatabase = (name: string, formSchema: FieldAttributes[]) => {
    const newDatabase: DatabaseFolder = {
      id: crypto.randomUUID(),
      name,
      formSchema,
      createdAt: new Date().toISOString(),
      hasPassword: false,
      recordCount: 0,
      records: [],
    };
    setDatabases((prev) => [...prev, newDatabase]);
    setActivePage("database");
  };

  const handleUpdateDatabase = (id: string, formSchema: FieldAttributes[]) => {
    setDatabases((prev) =>
      prev.map((db) => (db.id === id ? { ...db, formSchema } : db))
    );
    setActivePage("database");
  };

  const handleEditDatabase = (database: DatabaseFolder) => {
    setEditingDatabase(database);
    setActivePage("form-builder");
  };

  const handleDeleteDatabase = (id: string) => {
    setDatabases((prev) => prev.filter((db) => db.id !== id));
  };

  const handleSetPassword = (id: string) => {
    const password = prompt("Enter password for this database:");
    if (password) {
      setDatabases((prev) =>
        prev.map((db) =>
          db.id === id ? { ...db, hasPassword: true, password } : db
        )
      );
    }
  };

  const handleViewDatabase = (database: DatabaseFolder) => {
    if (database.hasPassword) {
      const inputPassword = prompt("Enter database password:");
      if (inputPassword !== database.password) {
        alert("Incorrect password!");
        return;
      }
    }
    setViewingDatabase(database);
    setActivePage("database-records");
  };

  const handleAddRecord = (databaseId: string, data: Record<string, any>) => {
    const newRecord: DatabaseRecord = {
      id: crypto.randomUUID(),
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDatabases((prev) =>
      prev.map((db) =>
        db.id === databaseId
          ? {
              ...db,
              records: [...db.records, newRecord],
              recordCount: db.recordCount + 1,
            }
          : db
      )
    );

    // Update viewing database
    setViewingDatabase((prev) => {
      if (prev && prev.id === databaseId) {
        return {
          ...prev,
          records: [...prev.records, newRecord],
          recordCount: prev.recordCount + 1,
        };
      }
      return prev;
    });
  };

  const handleUpdateRecord = (
    databaseId: string,
    recordId: string,
    data: Record<string, any>
  ) => {
    setDatabases((prev) =>
      prev.map((db) =>
        db.id === databaseId
          ? {
              ...db,
              records: db.records.map((record) =>
                record.id === recordId
                  ? { ...record, data, updatedAt: new Date().toISOString() }
                  : record
              ),
            }
          : db
      )
    );

    // Update viewing database
    setViewingDatabase((prev) => {
      if (prev && prev.id === databaseId) {
        return {
          ...prev,
          records: prev.records.map((record) =>
            record.id === recordId
              ? { ...record, data, updatedAt: new Date().toISOString() }
              : record
          ),
        };
      }
      return prev;
    });
  };

  const handleDeleteRecord = (databaseId: string, recordId: string) => {
    setDatabases((prev) =>
      prev.map((db) =>
        db.id === databaseId
          ? {
              ...db,
              records: db.records.filter((record) => record.id !== recordId),
              recordCount: Math.max(0, db.recordCount - 1),
            }
          : db
      )
    );

    // Update viewing database
    setViewingDatabase((prev) => {
      if (prev && prev.id === databaseId) {
        return {
          ...prev,
          records: prev.records.filter((record) => record.id !== recordId),
          recordCount: Math.max(0, prev.recordCount - 1),
        };
      }
      return prev;
    });
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardHome />;
      case "analytics":
        return <Analytics />;
      case "chatbot":
        return <Chatbot />;
      case "history":
        return <History />;
      case "settings":
        return <Settings />;
      case "nearby-stores":
        return <NearByStorePage/>
      case "database":
        return (
          <Database
            onCreateNew={() => {
              setEditingDatabase(null);
              setActivePage("form-builder");
            }}
            onViewDatabase={handleViewDatabase}
            onEditForm={handleEditDatabase}           
            databases={databases}
            onDeleteDatabase={handleDeleteDatabase}
            onSetPassword={handleSetPassword}
          />
        );
      case "form-builder":
        return (
          <FormBuilderPage
            onBack={() => setActivePage("database")}
            onSaveDatabase={
              editingDatabase
                ? (name, formSchema) => {
                    handleUpdateDatabase(editingDatabase.id, formSchema);
                    setEditingDatabase(null);
                  }
                : handleCreateDatabase
            }
            editingDatabase={editingDatabase}
          />
        );
      case "database-records":
        return viewingDatabase ? (
          <DatabaseRecordsView
            databaseId={viewingDatabase.id}
            databaseName={viewingDatabase.name}
            formSchema={viewingDatabase.formSchema}
            records={viewingDatabase.records}
            onAddRecord={(data) => handleAddRecord(viewingDatabase.id, data)}
            onUpdateRecord={(recordId, data) =>
              handleUpdateRecord(viewingDatabase.id, recordId, data)
            }
            onDeleteRecord={(recordId) =>
              handleDeleteRecord(viewingDatabase.id, recordId)
            }
            onOpenChatbot={() => setActivePage("database-chatbot")}
            onBack={() => {
              setViewingDatabase(null);
              setActivePage("database");
            }}
          />
        ) : null;
      case "database-chatbot":
        return viewingDatabase ? (
          <DatabaseChatbot
            databaseId={viewingDatabase.id}
            databaseName={viewingDatabase.name}
            formSchema={viewingDatabase.formSchema}
            recordCount={viewingDatabase.recordCount}
            onBack={() => setActivePage("database-records")}
          />
        ) : null;
      default:
        return <DashboardHome />;
    }
  };

  // Full-page routes (no sidebar/navbar)
  if (activePage === "form-builder" || activePage === "database-records" || activePage === "database-chatbot") {
    return (
      <div style={{ backgroundColor: currentTheme.background }}>
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
      {/* Sidebar - persistent, never re-renders */}
      <DashboardSidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - persistent, never re-renders */}
        <DashboardNavbar 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Page Content - only this changes */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: currentTheme.background }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}