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
import { Bell, Search, LogOut, User, Settings, GraduationCap, BookOpen, Bot, Bug, Megaphone, Flag, MessageSquare, Users } from "lucide-react";
import TourControl from "./TourControl";
import UserRoleSwitcher from "./UserRoleSwitcher";
import { useUserSwitching } from "@/hooks/useUserSwitching";

export default function TopBar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { switchedUser, switchUser, clearUserSwitch, isSwitched } = useUserSwitching();

  // Use switched user if available, otherwise use the regular user
  const currentUser = switchedUser || user;

  const { data: notifications } = useQuery<any[]>({
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
    <header className="bg-surface border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between h-14 md:h-16 md:px-6 md:py-4 flex-shrink-0 overflow-hidden">
      <div className="flex items-center flex-1 min-w-0">
        {/* Section titles are in a different area */}
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        {/* Enhanced Search - Mobile Responsive */}
        <div className="relative hidden sm:block flex-shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-48 md:w-56 lg:w-64"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        
        {/* Enhanced Notifications - Mobile Responsive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative btn-modern" data-tour="notifications">
              <Bell className="h-6 w-6 md:h-5 md:w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-6 w-6 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-sm md:text-xs font-bold">
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
        
        {/* Tour Control */}
        <TourControl />
        
        {/* Enhanced User Switcher - Mobile Responsive */}
        <div className="hidden md:block flex-shrink-0">
          <UserRoleSwitcher 
            currentUser={currentUser} 
            onUserSwitch={switchUser}
            trigger={
              <Button variant="outline" size="sm" className="btn-modern">
                <Users className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">{isSwitched ? 'Test User' : 'Switch User'}</span>
              </Button>
            }
          />
        </div>
        
        {/* Enhanced User Profile - Mobile Responsive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 btn-modern p-2 flex-shrink-0">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {(currentUser as any)?.firstName} {(currentUser as any)?.lastName}
                  {isSwitched && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Test
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 capitalize whitespace-nowrap">
                  {(currentUser as any)?.role?.replace('_', ' ') || 'User'}
                </div>
              </div>
              <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0">
                <AvatarImage src={(currentUser as any)?.profileImageUrl || ''} alt="Profile" />
                <AvatarFallback className="text-sm font-bold">
                  {getUserInitials((currentUser as any)?.firstName, (currentUser as any)?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Clear User Switch if active */}
            {isSwitched && (
              <>
                <DropdownMenuItem onClick={clearUserSwitch}>
                  <Users className="mr-2 h-4 w-4" />
                  Return to Original User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
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
            <DropdownMenuItem onClick={() => navigate('/settings')}>
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
