import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  GraduationCap,
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  Shield,
  BookOpen,
  Brain,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "teacher":
        return "default";
      case "admin":
        return "secondary";
      case "super_admin":
        return "destructive";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  // Role-based navigation items - keep only essential 4-5 items
  const getNavigationItems = () => {
    const role = (user as any)?.role || "student";

    if (["teacher", "admin", "super_admin"].includes(role)) {
      return [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/item-banks", label: "Questions", icon: BookOpen },
        { href: "/quiz-manager", label: "Quizzes", icon: ClipboardCheck },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/proctoring-security", label: "Proctoring", icon: Shield },
      ];
    } else {
      return [
        { href: "/student-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student-quiz", label: "Quizzes", icon: ClipboardCheck },
        { href: "/gradebook", label: "Grades", icon: BarChart3 },
        { href: "/study-resources", label: "Study", icon: Brain },
      ];
    }
  };

  const navItems = getNavigationItems();

  return (
    <header
      className="fixed top-0 left-0 lg:left-64 right-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
      role="banner"
      aria-label="Main navigation"
      data-testid="top-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
              aria-label="ProficiencyAI - Go to dashboard"
              data-testid="logo-link"
            >
              <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">ProficiencyAI</span>
            </Link>
          </div>

          {/* Navigation - Center (Desktop only) */}
          <nav
            className="hidden lg:flex items-center gap-2"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions - Right */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      variant="destructive"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification: any) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-3"
                      >
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto py-1 px-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.avatar} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getUserInitials((user as any)?.firstName, (user as any)?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(user as any)?.firstName || "User"}
                    </span>
                    <Badge variant={getRoleBadgeVariant((user as any)?.role)} className="text-xs h-4 px-1">
                      {(user as any)?.role || "student"}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <div className="font-medium">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(user as any)?.email}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu (Hamburger) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open mobile menu"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={(user as any)?.avatar} alt="User avatar" />
                        <AvatarFallback className="bg-primary text-white">
                          {getUserInitials((user as any)?.firstName, (user as any)?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {(user as any)?.firstName} {(user as any)?.lastName}
                        </div>
                        <Badge variant={getRoleBadgeVariant((user as any)?.role)} className="text-xs">
                          {(user as any)?.role || "student"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-4">
                    <div className="space-y-1">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          item.href === "/"
                            ? location === "/"
                            : location.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary text-white"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
