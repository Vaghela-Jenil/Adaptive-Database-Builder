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
import FormBuilderPage from "../DatabaseBuilder/FormBuilderPage";
import DatabaseRecordsView from "../DatabaseBuilder/DatabaseRecordsView";
import DatabaseChatbot from "../DatabaseBuilder/DatabaseChatbot";
import { DatabaseFolder } from "@/components/DatabaseBuilder/types"
import NearByStorePage from "../UserDashboard/pages/NearbyStore";

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentTheme } = useTheme();
  const [editingDatabase, setEditingDatabase] = useState<DatabaseFolder | null>(null);
  const [viewingDatabase, setViewingDatabase] = useState<DatabaseFolder | null>(null);

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
            onChangePage={(changePage) => {
              setEditingDatabase(null);
              setActivePage(changePage);
            }}
            onEditDatabase={(database) => {
              setEditingDatabase(database);
              setActivePage("form-builder");
            }}
            onViewDatabase={(database) => {
              setViewingDatabase(database);
              setActivePage("database-records");
            }}
          />
        );
      case "form-builder":
        return (
          <FormBuilderPage
            onBack={(activePage) => setActivePage(activePage)}
            editingDatabase={editingDatabase}
          />
        );
      case "database-records":
        return viewingDatabase ? (
          <DatabaseRecordsView
            currentDatabase={viewingDatabase}
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
            database={viewingDatabase}
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
          onChange={() => setActivePage('database')}
        />

        {/* Page Content - only this changes */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: currentTheme.background }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}