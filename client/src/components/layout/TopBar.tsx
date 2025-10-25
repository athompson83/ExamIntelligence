import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = "Dashboard" }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const typedUser = user as User | undefined;

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const userInitials = typedUser?.firstName && typedUser?.lastName 
    ? `${typedUser.firstName[0]}${typedUser.lastName[0]}`
    : typedUser?.email?.[0]?.toUpperCase() || "U";

  const userDisplayName = typedUser?.firstName && typedUser?.lastName
    ? `${typedUser.firstName} ${typedUser.lastName}`
    : typedUser?.email || "User";

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64"
          />
        </div>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount?.count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount.count}
            </Badge>
          )}
        </Button>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 h-auto py-2">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{userDisplayName}</div>
                <div className="text-xs text-muted-foreground capitalize">{typedUser?.role}</div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={typedUser?.profileImageUrl || ""} alt={userDisplayName} />
                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              Account Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
