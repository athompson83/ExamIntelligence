import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  Archive
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: BarChart3, tourId: "dashboard" },
    { href: "/item-banks", label: "Item Banks", icon: BookOpen, tourId: "item-banks" },
    { href: "/quiz-manager", label: "Quiz Manager", icon: Puzzle, tourId: "quiz-manager" },
    { href: "/assignments", label: "Assignments", icon: ClipboardCheck, tourId: "assignments" },
    { href: "/section-management", label: "Section Management", icon: Users, tourId: "section-management" },
    { href: "/mobile", label: "Mobile App", icon: Smartphone, tourId: "mobile" },
    { href: "/live-exams", label: "Live Exams", icon: PlayCircle, tourId: "live-exams" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, tourId: "analytics" },
    { href: "/study-resources", label: "Study Resources", icon: Brain, tourId: "study-resources" },
  ];

  const supportItems = [
    { href: "/announcements", label: "Announcements", icon: Megaphone, tourId: "announcements" },
    { href: "/question-feedback", label: "Question Feedback", icon: MessageSquare, tourId: "question-feedback" },
    { href: "/question-flagging", label: "Question Flagging", icon: Flag, tourId: "question-flagging" },
    { href: "/bug-reporting", label: "Bug Reports", icon: Bug, tourId: "bug-reporting" },
    { href: "/notification-settings", label: "Notifications", icon: Bell, tourId: "notifications" },
    { href: "/anonymous-quiz-access", label: "Anonymous Access", icon: HelpCircle, tourId: "anonymous-access" },
  ];

  const systemItems = [
    ...(['admin', 'teacher', 'super_admin'].includes(user?.role || '') ? [{ href: "/user-management", label: "User Management", icon: Users, tourId: "user-management" }] : []),
    { href: "/offline-sync", label: "Offline Sync", icon: Cloud, tourId: "offline-sync" },
    { href: "/archive-management", label: "Archive Management", icon: Archive, tourId: "archive-management" },
    { href: "/settings", label: "Settings", icon: Settings, tourId: "settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

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
      
      {/* Navigation - Scrollable */}
      <div className="flex flex-col mt-6 overflow-y-auto flex-1 pb-4">
        <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main Menu
        </div>
        
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                data-tour={item.tourId}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Support & Communication */}
        <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6">
          Support & Communication
        </div>
        
        <div className="space-y-1">
          {supportItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                data-tour={item.tourId}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {systemItems.length > 0 && (
          <>
            <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6">
              System
            </div>
            
            <div className="space-y-1">
              {systemItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    data-tour={item.tourId}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
