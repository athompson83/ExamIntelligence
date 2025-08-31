import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Search, 
  Bell, 
  Users, 
  Archive, 
  Building, 
  Shield, 
  Monitor, 
  Code 
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
      
      // Only hide when scrolling down AND the header is out of view (scrolled past 80px)
      if (st > lastScrollTop && st > 80) {
        // Scrolling down past header - hide with delay
        setIsVisible(false);
      } else {
        // Scrolling up OR still near top - show
        setIsVisible(true);
      }
      
      setLastScrollTop(st <= 0 ? 0 : st); // For Mobile or negative scrolling
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  // Calculate top position based on scroll position
  const getTopPosition = () => {
    if (!isVisible) return '-80px';
    
    // If we're near the top (within 56px of TopBar height), position below TopBar
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY <= 56) {
      return '56px'; // Below TopBar
    } else {
      return '0px'; // At top of viewport when TopBar is scrolled out
    }
  };

  const teacherNavItems = [
    { href: "/search", label: "Search", icon: Search },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/user-management", label: "Students", icon: Users },
    { href: "/super-admin-settings", label: "Admin", icon: Shield },
  ];

  const studentNavItems = [
    { href: "/search", label: "Search", icon: Search },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/prerequisites", label: "Prereqs", icon: Building },
    { href: "/accessibility-settings", label: "Access", icon: Monitor },
  ];

  const navItems = isStudentView ? studentNavItems : teacherNavItems;

  return (
    <div 
      className="instagram-style-nav fixed left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm lg:hidden"
      style={{
        top: getTopPosition(),
        transition: 'top 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
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