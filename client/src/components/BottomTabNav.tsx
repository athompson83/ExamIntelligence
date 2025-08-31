import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Home, 
  BookOpen, 
  Puzzle, 
  Calendar, 
  BarChart3, 
  Settings, 
  Users, 
  PlayCircle, 
  TrendingUp, 
  FileText,
  Plus,
  Search,
  GraduationCap,
  Brain
} from "lucide-react";

export function BottomTabNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userRole = (user as any)?.role || 'teacher';
  const isStudentView = location.startsWith('/student') || userRole === 'student';

  // Context-aware navigation based on current page
  const getContextualTabs = () => {
    if (location === '/' || location === '/dashboard') {
      return isStudentView ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/assignments", label: "Tasks", icon: Calendar },
        { href: "/study-aids", label: "Study", icon: FileText },
        { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
        { href: "/settings", label: "Settings", icon: Settings }
      ] : [
        { href: "/", label: "Home", icon: Home },
        { href: "/item-banks", label: "Create", icon: Plus },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings }
      ];
    }

    if (location.startsWith('/item-banks')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/item-banks", label: "Banks", icon: BookOpen },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
        { href: "/question-manager", label: "Questions", icon: Plus },
        { href: "/analytics", label: "Analytics", icon: BarChart3 }
      ];
    }

    if (location.startsWith('/quiz')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
        { href: "/item-banks", label: "Banks", icon: BookOpen },
        { href: "/live-exams", label: "Live", icon: PlayCircle },
        { href: "/analytics", label: "Analytics", icon: BarChart3 }
      ];
    }

    if (location.startsWith('/assignments')) {
      return isStudentView ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/assignments", label: "Tasks", icon: Calendar },
        { href: "/study-aids", label: "Study", icon: FileText },
        { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
        { href: "/live-exams", label: "Exams", icon: PlayCircle }
      ] : [
        { href: "/", label: "Home", icon: Home },
        { href: "/assignments", label: "Assignments", icon: Calendar },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
        { href: "/user-management", label: "Students", icon: Users },
        { href: "/analytics", label: "Analytics", icon: BarChart3 }
      ];
    }

    if (location.startsWith('/analytics')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
        { href: "/assignments", label: "Tasks", icon: Calendar },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle }
      ];
    }

    if (location.startsWith('/study')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/study-aids", label: "Study", icon: FileText },
        { href: "/assignments", label: "Tasks", icon: Calendar },
        { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
        { href: "/ai-resources", label: "AI Help", icon: Brain }
      ];
    }

    if (location.startsWith('/user-management')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/user-management", label: "Users", icon: Users },
        { href: "/assignments", label: "Assign", icon: Calendar },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings }
      ];
    }

    // Default tabs
    return isStudentView ? [
      { href: "/", label: "Home", icon: Home },
      { href: "/assignments", label: "Tasks", icon: Calendar },
      { href: "/study-aids", label: "Study", icon: FileText },
      { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
      { href: "/settings", label: "Settings", icon: Settings }
    ] : [
      { href: "/", label: "Home", icon: Home },
      { href: "/item-banks", label: "Create", icon: Plus },
      { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings }
    ];
  };

  const tabs = getContextualTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href || (tab.href !== '/' && location.startsWith(tab.href));
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}