'use client';
import { useState } from "react";
import DashboardNavbar from "./app-navbar";
import DashboardSidebar from "./app-sidebar";
import DashboardHome from "./pages/DashboardHome";
import Analytics from "./pages/Analytics";
import Chatbot from "./pages/chatbot";
import History from "./pages/History";
import Settings from "./pages/setting";

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");

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
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar - persistent, never re-renders */}
      <DashboardSidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - persistent, never re-renders */}
        <DashboardNavbar />

        {/* Page Content - only this changes */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
