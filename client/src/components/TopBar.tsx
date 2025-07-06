import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Bell, Search, LogOut, User, Settings, GraduationCap, BookOpen } from "lucide-react";

export default function TopBar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const isStudentView = location.startsWith('/student');
  
  const handleViewToggle = () => {
    console.log('View toggle clicked, current location:', location, 'isStudentView:', isStudentView);
    if (isStudentView) {
      navigate('/'); // Go to teacher dashboard
    } else {
      navigate('/student-dashboard'); // Go to student dashboard
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <header className="bg-surface border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center flex-1">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Dashboard
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64"
          />
        </div>
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications?.slice(0, 5).map((notification: any) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </div>
              </DropdownMenuItem>
            ))}
            {(!notifications || notifications.length === 0) && (
              <DropdownMenuItem className="text-center text-gray-500">
                No notifications
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 p-2">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role || 'User'}
                </div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || ''} alt="Profile" />
                <AvatarFallback>
                  {getUserInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewToggle}>
              {isStudentView ? (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Switch to Teacher View
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Switch to Student View
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
