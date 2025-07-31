import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
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
  LifeBuoy
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

  const menuGroups = [
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
        { href: "/cat-exam-test", label: "CAT Exam Test", icon: PlayCircle, tourId: "cat-exam-test" },
        { href: "/analytics", label: "Analytics", icon: BarChart3, tourId: "analytics" },
        { href: "/study-resources", label: "Study Resources", icon: Brain, tourId: "study-resources" },
      ]
    },
    {
      id: "mobile",
      label: "Mobile & Apps",
      icon: Smartphone,
      items: [
        { href: "/mobile", label: "Mobile App", icon: Smartphone, tourId: "mobile" },
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
        { href: "/core-functionality-test", label: "Core Tests", icon: Shield, tourId: "core-tests" },
        { href: "/pricing", label: "Pricing", icon: DollarSign, tourId: "pricing" },
        { href: "/billing", label: "Billing", icon: CreditCard, tourId: "billing" },
        { href: "/offline-sync", label: "Offline Sync", icon: Cloud, tourId: "offline-sync" },
        { href: "/archive-management", label: "Archive Management", icon: Archive, tourId: "archive-management" },
        { href: "/settings", label: "Settings", icon: Settings, tourId: "settings" },
      ]
    }
  ];

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
    <nav className="sidebar w-64 fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-primary px-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="bg-white rounded-lg p-2 mr-3">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-white text-xl font-bold">ProficiencyAI</h1>
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
                    w-full group flex items-center justify-between px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${groupHasActiveItem 
                      ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <GroupIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {group.label}
                  </div>
                  {shouldBeExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Group Items */}
              {shouldBeExpanded && (
                <div className={group.id === "main" ? "space-y-1" : "ml-4 mt-1 space-y-1"}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        ref={active ? activeItemRef : undefined}
                        className={`nav-item ${active ? 'active' : ''} ${group.id !== "main" ? "text-sm" : ""}`}
                        data-tour={item.tourId}
                      >
                        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
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
  );
}
