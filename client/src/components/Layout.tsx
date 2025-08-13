import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-background transition-all duration-200 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-64 transition-all duration-200 w-full min-w-0">
        <TopBar />
        <main className={`p-4 content-container transition-all duration-300 lg:p-6 ${
          isLoaded ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'
        }`}>
          <div className="lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
