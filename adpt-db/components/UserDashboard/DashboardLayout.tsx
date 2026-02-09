'use client';
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import DashboardSidebar from "./app-sidebar";
import DashboardNavbar from "./app-navbar";
import DashboardHome from "./pages/DashboardHome";
import Analytics from "./pages/Analytics";
import Chatbot from "./pages/chatbot";
import History from "./pages/History";
import Settings from "./pages/setting";
import Database from "./pages/Database";
import FormBuilderPage from "./pages/FormBuilderPage";
import { FieldAttributes } from "./pages/types";
import NearbyStore from "./pages/NearbyStore";

type DatabaseFolder = {
  id: string;
  name: string;
  formSchema: FieldAttributes[];
  createdAt: string;
  hasPassword: boolean;
  password?: string;
  recordCount: number;
};

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentTheme } = useTheme();
  const [databases, setDatabases] = useState<DatabaseFolder[]>([]);
  const [editingDatabase, setEditingDatabase] = useState<DatabaseFolder | null>(null);

  const handleCreateDatabase = (name: string, formSchema: FieldAttributes[]) => {
    const newDatabase: DatabaseFolder = {
      id: crypto.randomUUID(),
      name,
      formSchema,
      createdAt: new Date().toISOString(),
      hasPassword: false,
      recordCount: 0,
    };
    setDatabases((prev) => [...prev, newDatabase]);
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
    // TODO: Show database records view
    alert(`Opening ${database.name} database records view`);
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
      case "nearby-stores":
        return <NearbyStore/>
      case "settings":
        return <Settings />;
      case "database":
        return (
          <Database
            onCreateNew={() => {
              setEditingDatabase(null);
              setActivePage("form-builder");
            }}
            onEditForm={handleEditDatabase}
            onViewDatabase={handleViewDatabase}
            databases={databases}
            onDeleteDatabase={handleDeleteDatabase}
            onSetPassword={handleSetPassword}
          />
        );
      case "form-builder":
        return (
          <FormBuilderPage
            onBack={() => setActivePage("database")}
            onSaveDatabase={handleCreateDatabase}
            editingDatabase={editingDatabase}
          />
        );
      default:
        return <DashboardHome />;
    }
  };

  // Full-page routes (no sidebar/navbar)
  if (activePage === "form-builder") {
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