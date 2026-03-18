import type { Step } from "onborda";
import {
  BarChart3,
  Calendar,
  Folder,
  FolderLock,
  HelpCircle,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  MessageSquareMore,
  Sparkles,
} from "lucide-react";

export const dashboardTourName = "dashboard-tour";

type DashboardTour = {
  tour: string;
  steps: Step[];
};

const tourContentClassName = "space-y-2 text-sm leading-6";

export const dashboardTourSteps: DashboardTour[] = [
  {
    tour: dashboardTourName,
    steps: [
      {
        icon: <LayoutDashboard className="h-4 w-4" />,
        title: "Dashboard Home",
        content: (
          <div className={tourContentClassName}>
            <p>Start here for the fastest read on platform activity, recent changes, and key operating numbers.</p>
            <p>It is the right place to orient yourself before drilling into records or analytics.</p>
          </div>
        ),
        selector: "#onborda-dashboard-home",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <Folder className="h-4 w-4" />,
        title: "Database Workspace",
        content: (
          <div className={tourContentClassName}>
            <p>Create, manage, and secure your custom databases from this workspace.</p>
            <p>It is also the entry point for templates, record access, and schema editing.</p>
          </div>
        ),
        selector: "#onborda-database",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <BarChart3 className="h-4 w-4" />,
        title: "Analytics",
        content: (
          <div className={tourContentClassName}>
            <p>Use analytics to compare datasets, monitor trends, and turn raw records into decisions.</p>
            <p>This area is built for visual summaries rather than manual inspection.</p>
          </div>
        ),
        selector: "#onborda-analytics",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <Sparkles className="h-4 w-4" />,
        title: "Chatbot",
        content: (
          <div className={tourContentClassName}>
            <p>The AI assistant helps with navigation, data questions, and workflow guidance in natural language.</p>
            <p>Use it when you want faster answers without digging through every screen manually.</p>
          </div>
        ),
        selector: "#onborda-chatbot",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <MapPinned className="h-4 w-4" />,
        title: "Nearby Store",
        content: (
          <div className={tourContentClassName}>
            <p>Find nearby stores with map-based search, export options, and configurable location filters.</p>
            <p>It is useful when inventory or procurement decisions depend on physical proximity.</p>
          </div>
        ),
        selector: "#onborda-nearby-store",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <FolderLock className="h-4 w-4" />,
        title: "Shared Database",
        content: (
          <div className={tourContentClassName}>
            <p>Share database access with teammates and control collaboration through role-based permissions.</p>
            <p>This is the collaboration layer for secure internal data distribution.</p>
          </div>
        ),
        selector: "#onborda-shared-database",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <MessageSquareMore className="h-4 w-4" />,
        title: "Query Center",
        content: (
          <div className={tourContentClassName}>
            <p>Raise support tickets, track responses, and keep operational questions inside the product.</p>
            <p>It centralizes follow-up instead of pushing issue handling into scattered channels.</p>
          </div>
        ),
        selector: "#onborda-query",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <MessageSquare className="h-4 w-4" />,
        title: "Chat App",
        content: (
          <div className={tourContentClassName}>
            <p>Use chat for direct or group conversations, file exchange, and real-time collaboration.</p>
            <p>It complements shared data work when discussion needs to stay close to execution.</p>
          </div>
        ),
        selector: "#onborda-chat-app",
        side: "right",
        pointerPadding: 12,
        pointerRadius: 18,
      },
      {
        icon: <HelpCircle className="h-4 w-4" />,
        title: "Info Panel",
        content: (
          <div className={tourContentClassName}>
            <p>This opens the feature summary dialog with a compact overview of the platform areas.</p>
            <p>It is useful when users need a quick refresher without leaving the current workflow.</p>
          </div>
        ),
        selector: "#onborda-navbar-info",
        side: "bottom",
        pointerPadding: 10,
        pointerRadius: 14,
      },
      {
        icon: <HelpCircle className="h-4 w-4" />,
        title: "Message",
        content: (
          <div className={tourContentClassName}>
            <p>This consist of the alert regarding the message</p>
            <p>It opens up when there are important notifications or updates to share.</p>
          </div>
        ),
        selector: "#onborda-navbar-chat",
        side: "bottom",
        pointerPadding: 10,
        pointerRadius: 14,
      },
      {
        icon: <Calendar className="h-4 w-4" />,
        title: "Task Manager",
        content: (
          <div className={tourContentClassName}>
            <p>Track due items, review today's workload, and manage operational follow-through from the navbar.</p>
            <p>It keeps action management visible while you move across the rest of the app.</p>
          </div>
        ),
        selector: "#onborda-navbar-task-manager",
        side: "bottom",
        pointerPadding: 10,
        pointerRadius: 14,
      },
    ],
  },
];
