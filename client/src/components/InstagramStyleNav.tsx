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
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userRole = (user as any)?.role || 'teacher';
  const isStudentView = location.startsWith('/student') || userRole === 'student';

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = 5;
          
          // Only update if scrolled more than delta to avoid jitter
          if (Math.abs(lastScrollY - currentScrollY) <= delta) {
            ticking = false;
            return;
          }
          
          // Show by default, hide when scrolling down
          if (currentScrollY > lastScrollY && currentScrollY > 80) {
            setIsScrollingDown(true);
          } else {
            setIsScrollingDown(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
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
      className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm lg:hidden"
      style={{
        top: isScrollingDown ? '-64px' : '64px',
        transition: 'top 0.2s ease-in-out'
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