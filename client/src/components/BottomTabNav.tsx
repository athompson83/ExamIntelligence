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
  Brain,
  Archive
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

    if (location.startsWith('/archive-management')) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/archive-management", label: "Archive", icon: Archive },
        { href: "/item-banks", label: "Banks", icon: BookOpen },
        { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
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
    <div 
      className="bottom-tab-nav fixed left-0 right-0 bottom-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-2xl lg:hidden"
      style={{
        zIndex: 99999
      }}
    >
      <div className="flex pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href || (tab.href !== '/' && location.startsWith(tab.href));
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-2 flex-1 transition-all duration-150 ${
                isActive 
                  ? 'text-primary bg-primary/8' 
                  : 'text-gray-500 active:text-primary active:bg-gray-50 active:scale-95'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}