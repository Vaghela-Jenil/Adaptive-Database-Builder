'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

import DashboardSidebar from './app-sidebar';
import DashboardNavbar from './app-navbar';

import DashboardHome from './pages/DashboardHome';
import Analytics from './pages/Analytics';
import Chatbot from './pages/chatbot';
import History from './pages/History';
import Settings from './pages/setting';
import NearbyStore from './pages/NearbyStore';

type DashboardPage =
  | 'dashboard'
  | 'analytics'
  | 'chatbot'
  | 'history'
  | 'settings'
  | 'form-builder'
  | 'nearby-store';

export default function DashboardShell() {
  const [activePage, setActivePage] = useState<DashboardPage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { currentTheme } = useTheme();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
    >
      <DashboardSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto">
          {activePage === 'dashboard' && <DashboardHome />}
          {activePage === 'analytics' && <Analytics />}
          {activePage === 'chatbot' && <Chatbot />}
          {activePage === 'history' && <History />}
          {activePage === 'settings' && <Settings />}
          {activePage === 'nearby-store' && <NearbyStore />}
        </main>
      </div>
    </div>
  );
}
