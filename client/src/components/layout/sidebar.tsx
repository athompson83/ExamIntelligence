import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  Puzzle, 
  Play, 
  BarChart3, 
  Bot, 
  Users, 
  Settings,
  GraduationCap,
  Shield,
  FolderOpen,
  Target
} from "lucide-react";

const navigationItems = [
  {
    title: "MAIN MENU",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/" },
      { name: "Item Banks", icon: BookOpen, href: "/item-banks" },
      { name: "Quiz Builder", icon: Puzzle, href: "/enhanced-quiz-builder" },
      { name: "Reference Banks", icon: FolderOpen, href: "/reference-banks" },
      { name: "Live Exams", icon: Play, href: "/live-exams" },
      { name: "Analytics", icon: BarChart3, href: "/analytics" },
      { name: "AI Resources", icon: Bot, href: "/ai-resources" },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: "User Management", icon: Users, href: "/user-management" },
      { name: "Settings", icon: Settings, href: "/settings" },
    ]
  },
  {
    title: "ADMIN",
    items: [
      { name: "Admin Settings", icon: Shield, href: "/admin-settings" },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="border-r border-sidebar-border w-64 fixed inset-y-0 left-0 z-50 shadow-sm bg-[#ffffff]">
      {/* Header */}
      <div className="flex items-center justify-center h-16 bg-primary">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-2 mr-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-white text-xl font-bold">ProficiencyAI</h1>
        </div>
      </div>
      {/* Navigation */}
      <div className="flex flex-col mt-8">
        {navigationItems.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </div>
            
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center px-6 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors duration-200",
                  isActive && "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                )}>
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
