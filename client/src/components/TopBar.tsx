import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Role-based navigation items
  const getNavigationItems = () => {
    const role = (user as any)?.role || "student";

    if (["teacher", "admin", "super_admin"].includes(role)) {
      return [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/item-banks", label: "Questions", icon: BookOpen },
        { href: "/quiz-manager", label: "Quizzes", icon: ClipboardCheck },
        { href: "/assignments", label: "Assignments", icon: ClipboardCheck },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/proctoring-security", label: "Proctoring", icon: Shield },
      ];
    } else {
      return [
        { href: "/student-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student-quiz", label: "My Quizzes", icon: ClipboardCheck },
        { href: "/gradebook", label: "My Grades", icon: BarChart3 },
        { href: "/study-resources", label: "Study Aids", icon: Brain },
      ];
    }
  };

  const navItems = getNavigationItems();

  return (
    <header
      className="h-16 bg-background border-b shadow-sm"
      role="banner"
      aria-label="Main navigation"
      data-testid="top-bar"
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Logo/Brand - Left */}
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-semibold text-foreground hover:text-primary transition-colors duration-200"
            aria-label="ProficiencyAI - Go to dashboard"
            data-testid="logo-link"
          >
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
            <span className="hidden md:inline">ProficiencyAI</span>
          </Link>
        </div>

        {/* Navigation - Center (Desktop) */}
        <nav
          className="hidden lg:flex items-center space-x-1"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? location === "/"
                : location.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 px-4 transition-all duration-200",
                    isActive && "border-l-4 border-primary rounded-l-none"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
                >
                  <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Controls - Right */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Search Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                aria-label="Search"
                data-testid="button-search"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <Input
                  type="search"
                  placeholder="Search questions, quizzes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  data-testid="input-search"
                  aria-label="Search input"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-10 w-10 p-0"
                aria-label={`Notifications ${
                  unreadCount > 0 ? `(${unreadCount} unread)` : ""
                }`}
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications?.slice(0, 5).map((notification: any) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-4"
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </DropdownMenuItem>
              ))}
              {(!notifications || notifications.length === 0) && (
                <DropdownMenuItem className="text-center text-muted-foreground">
                  No notifications
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 px-2 hover:bg-accent transition-colors duration-200"
                aria-label="User menu"
                data-testid="button-user-menu"
              >
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                      <Badge
                        variant={getRoleBadgeVariant((user as any)?.role)}
                        className="text-xs capitalize"
                      >
                        {(user as any)?.role?.replace("_", " ") || "User"}
                      </Badge>
                    </div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={(user as any)?.profileImageUrl || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="text-sm font-bold">
                      {getUserInitials(
                        (user as any)?.firstName,
                        (user as any)?.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <User className="h-4 w-4 mr-2" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
