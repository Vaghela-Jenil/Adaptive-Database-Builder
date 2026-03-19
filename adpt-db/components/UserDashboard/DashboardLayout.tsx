'use client';
import { useState, useEffect } from "react";
import { Onborda, OnbordaProvider, useOnborda } from "onborda";
import { useTheme } from "@/context/ThemeContext";
import DashboardSidebar from "../UserDashboard/app-sidebar";
import DashboardNavbar from "../UserDashboard/app-navbar";
import DashboardHome from "../UserDashboard/pages/DashboardHome";
import Analytics from "../UserDashboard/pages/Analytics";
import Chatbot from "../UserDashboard/pages/chatbot";
import Database from "../UserDashboard/pages/Database";
import FormBuilderPage from "../DatabaseBuilder/FormBuilderPage";
import DatabaseRecordsView from "../DatabaseBuilder/DatabaseRecordsView";
import DatabaseChatbot from "../DatabaseBuilder/DatabaseChatbot";
import { DatabaseFolder, FieldAttributes } from "@/components/DatabaseBuilder/types"
import NearByStorePage from "../UserDashboard/pages/NearbyStore";
import VisitTracker from "@/components/VisitTracker";
import SharedDatabases from "./pages/SharedDatabase";
import UserSupport from "./pages/Query";
import ChatPage from "./pages/chat-app";
import { DashboardTourCard } from "./DashboardTourCard";
import { dashboardTourSteps, dashboardTourName } from "./dashboard-tour-steps";
import HistoryPage from "./pages/History";

function TourAutoLaunch({ setIsSidebarOpen }: { setIsSidebarOpen: (v: boolean) => void }) {
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("onborda-tour-pending")) return;

    setIsSidebarOpen(true);

    let attempts = 0;
    let cancelled = false;

    const tryStartTour = () => {
      if (cancelled) return;

      const firstTarget = document.querySelector("#onborda-dashboard-home");
      if (firstTarget) {
        localStorage.removeItem("onborda-tour-pending");
        startOnborda(dashboardTourName);
        return;
      }

      attempts += 1;
      if (attempts < 12) {
        window.setTimeout(tryStartTour, 250);
      }
    };

    const initialTimer = window.setTimeout(tryStartTour, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function DashboardLayout() {
    const { currentTheme } = useTheme();
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState<DatabaseFolder | null>(null);
  const [viewingDatabase, setViewingDatabase] = useState<DatabaseFolder | null>(null);
  const [viewingDatabaseRole, setViewingDatabaseRole] = useState<"Admin" | "Editor" | "Viewer" | undefined>(undefined);
  const [selectTemplate, setSelectTemplate] = useState<FieldAttributes[] | null>();

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsLoading(false);
    }, 500);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardHome 
       onChangePage={(changePage) => {
              setEditingDatabase(null);
              setActivePage(changePage);
            }}
      />;
      case "analytics": return <Analytics />;
      case "chatbot": return <Chatbot />;
      case "nearby-stores": return <NearByStorePage />;
       case "history": return <HistoryPage/>
      case "share-folder": return <SharedDatabases />;
      case "query" : return <UserSupport/>
      case "chat" : return <ChatPage />
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
            onViewDatabase={(database, userRole) => {
              setViewingDatabase(database);
              setViewingDatabaseRole(userRole);
              setActivePage("database-records");
            }}
            onSelectTemplate={(template) => setSelectTemplate(template)}
          />
        );
      case "form-builder":
        return <FormBuilderPage 
        onBack={(p) => {setActivePage(p); setSelectTemplate(null)}} 
        editingDatabase={editingDatabase} 
        SelectTemplate={selectTemplate} />;
      case "database-records":
        return viewingDatabase ? (
          <DatabaseRecordsView
            currentDatabase={viewingDatabase}
            userRole={viewingDatabaseRole}
            onOpenChatbot={() => setActivePage("database-chatbot")}
            onBack={() => { setViewingDatabase(null); setViewingDatabaseRole(undefined); setActivePage("database"); }}
          />
        ) : null;
      case "database-chatbot":
        return viewingDatabase ? (
          <DatabaseChatbot database={viewingDatabase} onBack={() => setActivePage("database-records")} />
        ) : null;
      default:
        return <DashboardHome 
       onChangePage={(changePage) => {
              setEditingDatabase(null);
              setActivePage(changePage);
            }}
      />;
    }
  };

  // Full-page routes
  if (["form-builder", "database-records", "database-chatbot"].includes(activePage)) {
    return (
      <div key={refreshKey} style={{ backgroundColor: currentTheme.background }}>
        {renderPage()}
      </div>
    );
  }

  return (
    <OnbordaProvider>
      <Onborda
        steps={dashboardTourSteps}
        shadowRgb="15, 23, 42"
        shadowOpacity="0.72"
        cardComponent={DashboardTourCard}
        cardTransition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <TourAutoLaunch setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
          <VisitTracker />
          <DashboardSidebar
            activePage={activePage}
            setActivePage={setActivePage}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardNavbar
              onChangePage={(changePage) => {
              setActivePage(changePage);
            }}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onRefresh={handleRefresh}
            />

            <main
              key={refreshKey}
              className="flex-1 overflow-y-auto relative"
              style={{ backgroundColor: currentTheme.background }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `${currentTheme.primary} transparent transparent ${currentTheme.primary}` }}
                  />
                </div>
              ) : (
                renderPage()
              )}
            </main>
          </div>
        </div>
      </Onborda>
    </OnbordaProvider>
  );
}