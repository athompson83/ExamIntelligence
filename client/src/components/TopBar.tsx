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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
    <>
    <header
      className="sticky top-0 left-0 lg:left-64 right-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300"
      role="banner"
      aria-label="Main navigation"
      data-testid="top-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left with gradient accent */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-600 transition-all duration-300 group"
              aria-label="ProficiencyAI - Go to dashboard"
              data-testid="logo-link"
            >
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
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
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
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
            {/* Search - Desktop */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                data-testid="search-input"
              />
            </div>

            {/* Search - Mobile (Sheet trigger) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-300"
              onClick={() => setSearchOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-300"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                      variant="destructive"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl p-2">
                <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification: any) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="rounded-xl p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-300 px-3 py-2"
                  data-testid="button-profile"
                >
                  <Avatar className="h-8 w-8 border-2 border-blue-500 shadow-md">
                    <AvatarImage src={(user as any)?.avatar} alt="User avatar" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold">
                      {getUserInitials((user as any)?.firstName, (user as any)?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden xl:flex flex-col items-start">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </div>
                    <Badge variant={getRoleBadgeVariant((user as any)?.role)} className="text-xs capitalize">
                      {(user as any)?.role}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2" data-testid="dropdown-profile">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(user as any)?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  data-testid="menu-logout"
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

    {/* Mobile Search Drawer */}
    <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
      <SheetContent side="top" className="p-6 rounded-b-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            autoFocus
            data-testid="search-input-mobile"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(false)}
            className="rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
