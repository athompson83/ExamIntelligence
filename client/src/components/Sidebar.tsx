import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState, useMemo } from "react";
import { 
  ClipboardCheck, 
  BookOpen, 
  PlayCircle, 
  Eye, 
  BarChart3, 
  Brain, 
  Users, 
  Settings,
  Puzzle,
  Award,
  SettingsIcon,
  Heart,
  TrendingUp,
  Shield,
  Bell,
  Bug,
  Megaphone,
  Flag,
  Bot,
  Code,
  MessageSquare,
  HelpCircle,
  Smartphone,
  Cloud,
  Archive,
  CreditCard,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Home,
  GraduationCap,
  FileText,
  Monitor,
  LifeBuoy,
  LinkIcon,
  Building,
  Crown,
  Activity,
  Database
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Check if any item in a group is currently active
  const isGroupActive = (items: any[]) => {
    return items.some(item => isActive(item.href));
  };

  const menuGroups = useMemo(() => [
    {
      id: "main",
      label: "Main",
      icon: Home,
      items: [
        { href: "/", label: "Dashboard", icon: Home, tourId: "dashboard" },
      ]
    },
    {
      id: "content",
      label: "Content Management",
      icon: FileText,
      items: [
        { href: "/item-banks", label: "Item Banks", icon: BookOpen, tourId: "item-banks" },
        { href: "/quiz-manager", label: "Quiz Manager", icon: Puzzle, tourId: "quiz-manager" },
        { href: "/assignments", label: "Assignments", icon: ClipboardCheck, tourId: "assignments" },
        { href: "/section-management", label: "Section Management", icon: Users, tourId: "section-management" },
      ]
    },
    {
      id: "assessment",
      label: "Assessment & Testing",
      icon: GraduationCap,
      items: [
        { href: "/live-exams", label: "Live Exams", icon: PlayCircle, tourId: "live-exams" },
        { href: "/cat-exam-builder", label: "CAT Exam Builder", icon: Brain, tourId: "cat-exam-builder" },
        { href: "/cat-exam-test", label: "CAT Exam", icon: PlayCircle, tourId: "cat-exam-test" },
        { href: "/analytics", label: "Analytics", icon: BarChart3, tourId: "analytics" },
        { href: "/study-resources", label: "Study Resources", icon: Brain, tourId: "study-resources" },
      ]
    },
    {
      id: "support",
      label: "Support & Feedback",
      icon: LifeBuoy,
      items: [
        { href: "/announcements", label: "Announcements", icon: Megaphone, tourId: "announcements" },
        { href: "/question-feedback", label: "Question Feedback", icon: MessageSquare, tourId: "question-feedback" },
        { href: "/question-flagging", label: "Question Flagging", icon: Flag, tourId: "question-flagging" },
        { href: "/bug-reporting", label: "Bug Reports", icon: Bug, tourId: "bug-reporting" },
        { href: "/notification-settings", label: "Notifications", icon: Bell, tourId: "notifications" },
        { href: "/anonymous-quiz-access", label: "Anonymous Access", icon: HelpCircle, tourId: "anonymous-access" },
      ]
    },
    {
      id: "system",
      label: "System & Settings",
      icon: Settings,
      items: [
        ...(['admin', 'teacher', 'super_admin'].includes((user as any)?.role || '') ? [{ href: "/user-management", label: "User Management", icon: Users, tourId: "user-management" }] : []),
        ...(['admin', 'super_admin'].includes((user as any)?.role || '') ? [{ href: "/admin/account-settings", label: "Account Settings", icon: Building, tourId: "account-settings" }] : []),
        { href: "/mobile", label: "Mobile App", icon: Smartphone, tourId: "mobile" },
        { href: "/core-functionality-test", label: "Core Tests", icon: Shield, tourId: "core-tests" },
        { href: "/pricing", label: "Pricing", icon: DollarSign, tourId: "pricing" },
        { href: "/billing", label: "Billing", icon: CreditCard, tourId: "billing" },
        { href: "/lti-integration", label: "LTI Integration", icon: LinkIcon, tourId: "lti-integration" },
        { href: "/offline-sync", label: "Offline Sync", icon: Cloud, tourId: "offline-sync" },
        { href: "/archive-management", label: "Archive Management", icon: Archive, tourId: "archive-management" },
        { href: "/settings", label: "Settings", icon: Settings, tourId: "settings" },
      ]
    },
    ...((user as any)?.role === 'super_admin' ? [{
      id: "super_admin",
      label: "Super Admin",
      icon: Crown,
      items: [
        { href: "/admin/role-settings", label: "Role & Tier Management", icon: Shield, tourId: "role-settings" },
        { href: "/admin/database-management", label: "Database Management", icon: Database, tourId: "database-management" },
        { href: "/admin/system-settings", label: "System Settings", icon: Settings, tourId: "system-settings" },
        { href: "/admin/user-activity", label: "User Activity", icon: Activity, tourId: "user-activity" },
      ]
    }] : [])
  ], [user]);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  // Check if container can scroll
  const checkScrollable = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const canScrollUpward = container.scrollTop > 0;
    const canScrollDownward = container.scrollTop < container.scrollHeight - container.clientHeight;
    
    setCanScrollUp(canScrollUpward);
    setCanScrollDown(canScrollDownward);
  };

  // Smooth scroll to active item
  const scrollToActiveItem = () => {
    if (!activeItemRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const activeItem = activeItemRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    
    // Check if item is not fully visible
    const itemTop = itemRect.top - containerRect.top;
    const itemBottom = itemRect.bottom - containerRect.top;
    
    if (itemTop < 0 || itemBottom > containerRect.height) {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Manual scroll functions
  const scrollUp = () => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    scrollContainerRef.current.scrollBy({
      top: -200,
      behavior: 'smooth'
    });
    setTimeout(() => setIsScrolling(false), 500);
  };

  const scrollDown = () => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    scrollContainerRef.current.scrollBy({
      top: 200,
      behavior: 'smooth'
    });
    setTimeout(() => setIsScrolling(false), 500);
  };

  // Effect to handle scroll events and auto-scroll to active item
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollable();
      scrollToActiveItem();
    }, 100);
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      checkScrollable();
    };
    
    container.addEventListener('scroll', handleScroll);
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollable, 50);
    });
    resizeObserver.observe(container);
    
    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [location]);

  return (
    <>
      {/* Enhanced Mobile Navigation Bar (shown on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-primary z-[9999] px-4 py-2 shadow-lg backdrop-blur-md bg-primary/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white rounded-lg p-1.5 mr-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-white text-base font-bold">ProficiencyAI</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/20 transition-all duration-200 btn-mobile min-h-[36px] min-w-[36px]"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
          </button>
        </div>
      </div>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[9990]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Enhanced Desktop Sidebar & Mobile Drawer */}
      <nav className={`
        sidebar bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col
        w-64 min-w-64 max-w-64 fixed inset-y-0 left-0 z-[9991]
        lg:translate-x-0
        lg:block
        max-w-[85vw] transform transition-all duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isMobileMenuOpen ? 'pt-12' : 'pt-0 lg:pt-0'}
      `}>
        {/* Enhanced Logo */}
        <div className="flex items-center justify-center h-16 bg-primary px-4 flex-shrink-0 lg:h-16 lg:px-4">
          <div className="flex items-center">
            <div className="bg-white rounded-xl p-2 mr-3 lg:p-2 lg:mr-3">
              <ClipboardCheck className="h-6 w-6 text-primary lg:h-6 lg:w-6" />
            </div>
            <h1 className="text-white text-xl font-bold lg:text-xl">ProficiencyAI</h1>
          </div>
        </div>
      
      {/* Scroll up indicator */}
      {canScrollUp && (
        <div className="flex-shrink-0 px-4 py-1">
          <button
            onClick={scrollUp}
            className={`w-full flex items-center justify-center py-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 dark:text-gray-400 dark:hover:text-primary transition-all duration-200 ${
              isScrolling ? 'animate-pulse' : 'scroll-indicator'
            }`}
            title="Scroll up to see more items"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Navigation - Scrollable */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-col flex-1 pb-4 px-2 sidebar-scroll"
        onScroll={checkScrollable}
        style={{ minHeight: 0 }}
      >
        {/* Grouped Navigation */}
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups.has(group.id);
          const groupHasActiveItem = isGroupActive(group.items);
          
          // Always expand Dashboard group, and expand groups with active items
          const shouldBeExpanded = group.id === "main" || isExpanded || groupHasActiveItem;
          
          return (
            <div key={group.id} className="mb-2">
              {/* Group Header */}
              {group.id !== "main" && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full group flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ease-out whitespace-nowrap mx-2 min-h-[44px] lg:px-4 lg:py-2.5 lg:text-sm lg:min-h-[44px]
                    ${groupHasActiveItem 
                      ? 'bg-gradient-to-r from-primary/15 to-primary/10 text-primary border-l-2 border-primary shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-800 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <GroupIcon className="mr-3 h-5 w-5 flex-shrink-0 lg:mr-3 lg:h-5 lg:w-5" />
                    <span className="font-semibold lg:font-semibold">{group.label}</span>
                  </div>
                  {shouldBeExpanded ? (
                    <ChevronUp className="h-4 w-4 lg:h-4 lg:w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 lg:h-4 lg:w-4" />
                  )}
                </button>
              )}
              {/* Group Items */}
              {shouldBeExpanded && (
                <div className={group.id === "main" ? "space-y-1 lg:space-y-1" : "ml-4 mt-1 space-y-1 lg:ml-4 lg:mt-1 lg:space-y-1"}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        ref={active ? activeItemRef : undefined}
                        className={`nav-item ${active ? 'active' : ''} ${group.id !== "main" ? "text-sm lg:text-sm" : "text-base lg:text-base"} btn-mobile min-h-[44px] lg:min-h-[44px]`}
                        data-tour={item.tourId}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 mr-3 flex-shrink-0 lg:h-4 lg:w-4 lg:mr-3" />
                        <span className="font-medium flex-1 text-[#6b7280]">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Scroll down indicator */}
      {canScrollDown && (
        <div className="flex-shrink-0 px-4 py-1">
          <button
            onClick={scrollDown}
            className={`w-full flex items-center justify-center py-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 dark:text-gray-400 dark:hover:text-primary transition-all duration-200 ${
              isScrolling ? 'animate-pulse' : 'scroll-indicator'
            }`}
            title="Scroll down to see more items"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
      {/* Mobile Content Spacer - for mobile header only */}
      <div className="lg:hidden block h-12" />
    </>
  );
}
