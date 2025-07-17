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
    <div className="min-h-screen flex bg-background transition-all duration-200">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-200">
        <TopBar />
        <main className={`p-6 content-container transition-all duration-300 ${
          isLoaded ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
