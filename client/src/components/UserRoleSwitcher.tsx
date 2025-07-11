import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, 
  User, 
  Shield, 
  GraduationCap, 
  BookOpen, 
  Crown,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DummyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'student';
  profileImageUrl?: string;
  accountId: string;
  isActive: boolean;
}

interface UserRoleSwitcherProps {
  currentUser: any;
  onUserSwitch: (user: DummyUser) => void;
  trigger?: React.ReactNode;
}

export default function UserRoleSwitcher({ 
  currentUser, 
  onUserSwitch, 
  trigger 
}: UserRoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to get dummy users
  const { data: dummyUsers, isLoading } = useQuery({
    queryKey: ['/api/dummy-users'],
    enabled: isOpen,
  });

  // Mutation to seed dummy users
  const seedUsersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/seed-dummy-users', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dummy-users'] });
      toast({
        title: "Success",
        description: "Dummy users created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dummy users",
        variant: "destructive",
      });
    },
  });

  // Mutation to switch user
  const switchUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/switch-user/${userId}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      onUserSwitch(data.user);
      setIsOpen(false);
      toast({
        title: "User Switched",
        description: `Now logged in as ${data.user.firstName} ${data.user.lastName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to switch user: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4" />;
      case 'student':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleSeedUsers = () => {
    seedUsersMutation.mutate();
  };

  const handleSwitchUser = (user: DummyUser) => {
    switchUserMutation.mutate(user.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Switch User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Role Switcher
          </DialogTitle>
          <DialogDescription>
            Switch between different user roles to test features across permission levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current User */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentUser?.profileImageUrl} />
                  <AvatarFallback>
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
                <Badge className={getRoleColor(currentUser?.role)}>
                  {getRoleIcon(currentUser?.role)}
                  <span className="ml-1">{formatRole(currentUser?.role)}</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Seed Users Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Test Users</h3>
            <Button
              onClick={handleSeedUsers}
              disabled={seedUsersMutation.isPending}
              variant="outline"
              size="sm"
            >
              {seedUsersMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Create Test Users
            </Button>
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : !dummyUsers || dummyUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardDescription>
                  No test users available. Click "Create Test Users" to generate dummy users for testing.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {dummyUsers.map((user: DummyUser) => (
                <Card 
                  key={user.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    user.id === currentUser?.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSwitchUser(user)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {user.firstName} {user.lastName}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-primary">(Current)</span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{formatRole(user.role)}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}