import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  ClipboardCheck, 
  BookOpen, 
  PlayCircle, 
  Eye, 
  BarChart3, 
  Brain, 
  Users, 
  Settings,
  Puzzle
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/item-banks", label: "Item Banks", icon: BookOpen },
    { href: "/quiz-builder", label: "Quiz Builder", icon: Puzzle },
    { href: "/live-exams", label: "Live Exams", icon: PlayCircle },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/ai-resources", label: "AI Resources", icon: Brain },
  ];

  const systemItems = [
    ...(user?.role === 'admin' ? [{ href: "/user-management", label: "User Management", icon: Users }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="bg-white dark:bg-white border-r border-gray-200 dark:border-gray-700 w-64 fixed inset-y-0 left-0 z-50 shadow-sm" style={{ backgroundColor: 'white' }}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-primary">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-2 mr-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-white text-xl font-bold">ExamGen Pro</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex flex-col mt-8">
        <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          MAIN MENU
        </div>
        
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
        
        {systemItems.length > 0 && (
          <>
            <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-8">
              SYSTEM
            </div>
            
            {systemItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
}
