import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User } from "lucide-react";

export function TopBar() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">ProficiencyAI</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}