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
  Smartphone
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/item-banks", label: "Item Banks", icon: BookOpen },
    { href: "/quiz-manager", label: "Quiz Manager", icon: Puzzle },
    { href: "/section-management", label: "Section Management", icon: Users },
    { href: "/mobile", label: "Mobile App", icon: Smartphone },
    { href: "/live-exams", label: "Live Exams", icon: PlayCircle },
    { href: "/proctoring-security", label: "Proctoring Security", icon: Shield },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/ai-resources", label: "AI Resources", icon: Brain },
    { href: "/ai-chatbot", label: "AI Assistant", icon: Bot },
    { href: "/difficulty-tracking", label: "Difficulty Tracking", icon: TrendingUp },
    { href: "/learning-feedback", label: "Learning Feedback", icon: Heart },
    { href: "/badges-certificates", label: "Badges & Certificates", icon: Award },
    { href: "/badge-system", label: "Badge System", icon: Award },
  ];

  const supportItems = [
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/question-feedback", label: "Question Feedback", icon: MessageSquare },
    { href: "/question-flagging", label: "Question Flagging", icon: Flag },
    { href: "/bug-reporting", label: "Bug Reports", icon: Bug },
    { href: "/notification-settings", label: "Notifications", icon: Bell },
    { href: "/anonymous-quiz-access", label: "Anonymous Access", icon: HelpCircle },
  ];

  const systemItems = [
    ...(user?.role === 'admin' ? [{ href: "/user-management", label: "User Management", icon: Users }] : []),
    ...(user?.role === 'super_admin' ? [{ href: "/backend-prompt-management", label: "Prompt Management", icon: Code }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/accessibility-settings", label: "Accessibility", icon: SettingsIcon },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="sidebar-white w-64 fixed inset-y-0 left-0 z-50 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
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
