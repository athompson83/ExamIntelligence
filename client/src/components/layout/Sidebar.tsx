import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  BookOpen, 
  Settings, 
  Users, 
  Puzzle, 
  Play, 
  Brain,
  FolderOpen,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar,
  Link2,
  TrendingUp,
  Headphones,
  Activity,
  Shield,
  Target
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const getTeacherNavigation = (t: any) => [
  { name: t('navigation.dashboard'), href: "/", icon: LayoutDashboard },
  { name: t('navigation.itemBanks'), href: "/item-banks", icon: FolderOpen },
  { name: t('navigation.quizBuilder'), href: "/quiz-manager", icon: Puzzle },
  { name: "CAT Exams", href: "/cat-exams", icon: Target },
  { name: "AI CAT Generator", href: "/ai-cat-generator", icon: Brain },
  { name: "Assignments", href: "/assignments", icon: Calendar },
  { name: "Study Aids", href: "/study-aids", icon: BookOpen },
  { name: "Prerequisites", href: "/prerequisites", icon: Link2 },
  { name: "Gradebook", href: "/gradebook", icon: BarChart3 },
  { name: "Progress Tracking", href: "/progress-tracking", icon: TrendingUp },
  { name: t('navigation.liveExams'), href: "/live-exams", icon: Play },
  { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3 },
  { name: "AI Resources", href: "/ai-resources", icon: Brain },
  { name: t('navigation.userManagement'), href: "/user-management", icon: Users },
  { name: "Customer Support", href: "/customer-support", icon: Headphones },
  { name: t('navigation.settings'), href: "/settings", icon: Settings },
];

const getAdminNavigation = (t: any) => [
  { name: t('navigation.dashboard'), href: "/", icon: LayoutDashboard },
  { name: t('navigation.itemBanks'), href: "/item-banks", icon: FolderOpen },
  { name: t('navigation.quizBuilder'), href: "/quiz-manager", icon: Puzzle },
  { name: "CAT Exams", href: "/cat-exams", icon: Target },
  { name: "AI CAT Generator", href: "/ai-cat-generator", icon: Brain },
  { name: "Assignments", href: "/assignments", icon: Calendar },
  { name: "Study Aids", href: "/study-aids", icon: BookOpen },
  { name: "Prerequisites", href: "/prerequisites", icon: Link2 },
  { name: "Gradebook", href: "/gradebook", icon: BarChart3 },
  { name: "Progress Tracking", href: "/progress-tracking", icon: TrendingUp },
  { name: t('navigation.liveExams'), href: "/live-exams", icon: Play },
  { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3 },
  { name: "AI Resources", href: "/ai-resources", icon: Brain },
  { name: t('navigation.userManagement'), href: "/user-management", icon: Users },
  { name: "User Activity", href: "/admin/user-activity", icon: Activity },
  { name: "Customer Support", href: "/customer-support", icon: Headphones },
  { name: t('navigation.settings'), href: "/settings", icon: Settings },
];

const getSuperAdminNavigation = (t: any) => [
  { name: t('navigation.dashboard'), href: "/", icon: LayoutDashboard },
  { name: t('navigation.itemBanks'), href: "/item-banks", icon: FolderOpen },
  { name: t('navigation.quizBuilder'), href: "/quiz-manager", icon: Puzzle },
  { name: "CAT Exams", href: "/cat-exams", icon: Target },
  { name: "AI CAT Generator", href: "/ai-cat-generator", icon: Brain },
  { name: "Assignments", href: "/assignments", icon: Calendar },
  { name: "Study Aids", href: "/study-aids", icon: BookOpen },
  { name: "Prerequisites", href: "/prerequisites", icon: Link2 },
  { name: "Gradebook", href: "/gradebook", icon: BarChart3 },
  { name: "Progress Tracking", href: "/progress-tracking", icon: TrendingUp },
  { name: t('navigation.liveExams'), href: "/live-exams", icon: Play },
  { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3 },
  { name: "AI Resources", href: "/ai-resources", icon: Brain },
  { name: t('navigation.userManagement'), href: "/user-management", icon: Users },
  { name: "User Activity", href: "/admin/user-activity", icon: Activity },
  { name: "Super Admin CRM", href: "/super-admin-settings", icon: Shield },
  { name: "Customer Support", href: "/customer-support", icon: Headphones },
  { name: t('navigation.settings'), href: "/settings", icon: Settings },
];

const getStudentNavigation = (t: any) => [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Assignments", href: "/assignments", icon: Calendar },
  { name: "Study Aids", href: "/study-aids", icon: BookOpen },
  { name: "My Progress", href: "/progress-tracking", icon: TrendingUp },
  { name: "Support", href: "/customer-support", icon: Headphones },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Get user role from auth context
  const userRole = (user as any)?.role || 'teacher';
  
  // Determine navigation based on user role
  const isStudentView = location.startsWith('/student') || userRole === 'student';
  const isSuperAdminView = userRole === 'super_admin';
  const isAdminView = userRole === 'admin';
  
  let navigation;
  if (isStudentView) {
    navigation = getStudentNavigation(t);
  } else if (isSuperAdminView) {
    navigation = getSuperAdminNavigation(t);
  } else if (isAdminView) {
    navigation = getAdminNavigation(t);
  } else {
    navigation = getTeacherNavigation(t);
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    // Dispatch custom event for layout to listen
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { isCollapsed: newState }
    }));
  };

  return (
    <nav className={cn(
      "bg-white dark:bg-white border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0 z-50 shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )} style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 bg-primary px-4">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-2 mr-2">
            <GraduationCap className="text-primary h-6 w-6" />
          </div>
          {!isCollapsed && (
            <h1 className="text-white text-xl font-bold">ProficiencyAI</h1>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="text-white hover:text-gray-200 transition-colors duration-200"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Navigation */}
      <div className="flex flex-col mt-8">
        {!isCollapsed && (
          <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </div>
        )}
        
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center py-3 text-sm font-medium rounded-md transition-colors duration-200 group relative",
                  isCollapsed ? "px-3 justify-center" : "px-3",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.name}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
