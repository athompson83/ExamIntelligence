import { ReactNode, useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px for w-64

  useEffect(() => {
    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.isCollapsed ? 64 : 256);
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div 
        className="flex-1 transition-all duration-300" 
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <TopBar title={title} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
