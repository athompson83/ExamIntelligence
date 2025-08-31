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
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userRole = (user as any)?.role || 'teacher';
  const isStudentView = location.startsWith('/student') || userRole === 'student';

  useEffect(() => {
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      
      if (st > lastScrollTop) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollTop(st <= 0 ? 0 : st); // For Mobile or negative scrolling
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

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
      className="instagram-style-nav fixed left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm lg:hidden"
      style={{
        top: isVisible ? '56px' : '-80px',
        transition: 'top 0.2s ease-in-out',
        zIndex: 99999,
        width: '100vw'
      }}
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