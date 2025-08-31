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
      
      // Instagram/Twitter behavior: instant response to scroll direction
      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Show immediately on any upward scroll
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Hide on any downward scroll
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
      className={`fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm transition-transform duration-150 ease-out lg:hidden ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 flex-1 transition-all duration-150 ${
                isActive 
                  ? 'text-primary bg-primary/8' 
                  : 'text-gray-500 active:text-primary active:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}