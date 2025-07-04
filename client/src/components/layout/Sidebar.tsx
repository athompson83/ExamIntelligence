import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  BookOpen, 
  Settings, 
  Users, 
  Puzzle, 
  Play, 
  Brain,
  FolderOpen,
  LayoutDashboard
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Item Banks", href: "/item-banks", icon: FolderOpen },
  { name: "Quiz Builder", href: "/quiz-builder", icon: Puzzle },
  { name: "Live Exams", href: "/live-exams", icon: Play },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Resources", href: "/ai-resources", icon: Brain },
  { name: "User Management", href: "/user-management", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <nav className={cn("bg-sidebar border-r border-sidebar-border w-64 fixed inset-y-0 left-0 z-50 shadow-sm", className)}>
      <div className="flex items-center justify-center h-16 bg-primary">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-2 mr-2">
            <BookOpen className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-white text-xl font-bold">ExamGen Pro</h1>
        </div>
      </div>
      
      <div className="flex flex-col mt-8">
        <div className="px-6 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Main Menu
        </div>
        
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
