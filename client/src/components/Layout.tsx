import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { InstagramStyleNav } from "./InstagramStyleNav";
import { BottomTabNav } from "./BottomTabNav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Enhanced loading animation with preload optimization
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Preload critical resources
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--page-loaded', '1');
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-background/95 transition-all duration-500 overflow-x-hidden safe-area-inset">
      <Sidebar />
      <div className="flex-1 lg:ml-64 transition-all duration-300 ease-out w-full min-w-0 flex flex-col min-h-screen">
        <TopBar />
        <InstagramStyleNav />
        <main className={`flex-1 p-4 transition-all duration-300 ease-out lg:p-6 overflow-hidden pb-20 lg:pb-4 ${
          isLoaded ? 'opacity-100 transform-none fade-in-fast' : 'opacity-0 translate-y-4'
        }`}>
          <div className="lg:pt-0 animate-in fade-in-0 duration-700 pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
      <BottomTabNav />
    </div>
  );
}
