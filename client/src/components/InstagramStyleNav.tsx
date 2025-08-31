import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  BookOpen, 
  Puzzle, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  GraduationCap, 
  FileText, 
  PlayCircle 
} from "lucide-react";

export function InstagramStyleNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userRole = (user as any)?.role || 'teacher';
  const isStudentView = location.startsWith('/student') || userRole === 'student';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top, show immediately when scrolling up, hide when scrolling down
      if (currentScrollY === 0) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Show immediately when scrolling up
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Hide when scrolling down
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const teacherNavItems = [
    { href: "/item-banks", label: "Item Banks", icon: BookOpen },
    { href: "/quiz-manager", label: "Quizzes", icon: Puzzle },
    { href: "/assignments", label: "Assignments", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const studentNavItems = [
    { href: "/progress-tracking", label: "Progress", icon: TrendingUp },
    { href: "/assignments", label: "Calendar", icon: Calendar },
    { href: "/study-aids", label: "Study", icon: FileText },
    { href: "/live-exams", label: "Exams", icon: PlayCircle },
  ];

  const navItems = isStudentView ? studentNavItems : teacherNavItems;

  return (
    <div 
      className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md transition-transform duration-150 lg:hidden ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center py-3 px-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center space-y-1 py-2 px-1 transition-colors flex-1 text-center ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}