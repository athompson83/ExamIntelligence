import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, Mail, Users, Settings, UserCheck } from 'lucide-react';
import Layout from '@/components/Layout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'student';
  isActive: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipients: string[];
  createdAt: string;
  sentAt?: string;
}

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    recipients: 'all' as 'all' | 'section',
    sectionId: '',
  });
  const [filterRole, setFilterRole] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Fetch sections for notifications
  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    retry: false,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/sent'],
    retry: false,
  });

  // User impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/impersonate`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Impersonation Started",
        description: `Now viewing the app as ${selectedUser?.firstName} ${selectedUser?.lastName}`,
      });
      // Reload the page to apply impersonation
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start impersonation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Sent",
        description: "A password reset email has been sent to the user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await apiRequest('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/sent'] });
      setShowNotificationDialog(false);
      setNotificationData({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all',
        sectionId: '',
      });
      toast({
        title: "Notification Sent",
        description: "Your notification has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImpersonateUser = (user: User) => {
    setSelectedUser(user);
    setShowImpersonateDialog(true);
  };

  const confirmImpersonation = () => {
    if (selectedUser) {
      impersonateMutation.mutate(selectedUser.id);
      setShowImpersonateDialog(false);
    }
  };

  const handleResetPassword = (user: User) => {
    resetPasswordMutation.mutate(user.id);
  };

  const handleSendNotification = () => {
    sendNotificationMutation.mutate(notificationData);
  };

  const filteredUsers = users.filter(user => 
    filterRole === 'all' || user.role === filterRole
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (usersLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setShowNotificationDialog(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User List</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="role-filter">Filter by Role:</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonateUser(user)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View As
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          disabled={resetPasswordMutation.isPending}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant={notification.type === 'info' ? 'default' : 'secondary'}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Recipients: {notification.recipients.length}</span>
                        <span>Sent: {new Date(notification.sentAt || notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Impersonation Confirmation Dialog */}
        <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm User Impersonation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to view the app as:</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedUser?.firstName} {selectedUser?.lastName}</p>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                <Badge className={getRoleBadgeColor(selectedUser?.role || '')}>
                  {selectedUser?.role.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                This will reload the page and you will see the app from their perspective.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowImpersonateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmImpersonation} disabled={impersonateMutation.isPending}>
                  {impersonateMutation.isPending ? 'Starting...' : 'Start Impersonation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Notification Dialog */}
        <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  value={notificationData.message}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={notificationData.type} onValueChange={(value: any) => setNotificationData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select value={notificationData.recipients} onValueChange={(value: any) => setNotificationData(prev => ({ ...prev, recipients: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="section">Specific Section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {notificationData.recipients === 'section' && (
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select value={notificationData.sectionId} onValueChange={(value) => setNotificationData(prev => ({ ...prev, sectionId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section: any) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendNotification} 
                  disabled={sendNotificationMutation.isPending || !notificationData.title || !notificationData.message}
                >
                  {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}