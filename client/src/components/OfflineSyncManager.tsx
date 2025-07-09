import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  WifiOff, 
  CloudOff, 
  Cloud, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Smartphone,
  Users,
  Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface OfflineAction {
  id: string;
  actionType: string;
  payload: any;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  errorMessage?: string;
  retryCount?: number;
}

interface DeviceStatus {
  id: string;
  offlineModeSupported: boolean;
  storageCapacity: number;
  storageUsed: number;
  pendingActions: number;
  syncErrors: number;
  lastSyncAt: string;
  lastSeenAt: string;
}

interface TeacherNotification {
  id: string;
  studentId: string;
  quizId: string;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface OfflineSyncManagerProps {
  deviceId: string;
  userId?: string;
  isTeacher?: boolean;
}

export default function OfflineSyncManager({ 
  deviceId, 
  userId, 
  isTeacher = false 
}: OfflineSyncManagerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const queryClient = useQueryClient();

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get pending sync actions
  const { data: pendingActions = [], refetch: refetchPending } = useQuery({
    queryKey: ['/api/offline-sync/pending', deviceId],
    queryFn: () => apiRequest(`/api/offline-sync/pending/${deviceId}`),
    enabled: !!deviceId,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Get device sync status
  const { data: deviceStatus } = useQuery({
    queryKey: ['/api/offline-sync/device-status', deviceId],
    queryFn: () => apiRequest(`/api/offline-sync/device-status/${deviceId}`),
    enabled: !!deviceId,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Get teacher notifications (if teacher)
  const { data: teacherNotifications = [] } = useQuery({
    queryKey: ['/api/offline-sync/teacher-notifications'],
    queryFn: () => apiRequest('/api/offline-sync/teacher-notifications'),
    enabled: isTeacher,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Process sync queue mutation
  const processSyncMutation = useMutation({
    mutationFn: () => apiRequest(`/api/offline-sync/process/${deviceId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['/api/offline-sync/device-status', deviceId] });
    }
  });

  // Queue offline action mutation
  const queueActionMutation = useMutation({
    mutationFn: (action: { actionType: string; payload: any; priority?: string }) => 
      apiRequest('/api/offline-sync/queue', {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          ...action
        })
      }),
    onSuccess: () => {
      refetchPending();
    }
  });

  // Log connection event mutation
  const logConnectionMutation = useMutation({
    mutationFn: (event: { 
      eventType: string; 
      quality?: string; 
      context?: any; 
      sessionId: string;
      quizAttemptId?: string;
    }) => 
      apiRequest('/api/offline-sync/connection-log', {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          ...event
        })
      })
  });

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/offline-sync/notifications/${notificationId}/read`, {
        method: 'PUT'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offline-sync/teacher-notifications'] });
    }
  });

  const handleProcessSync = () => {
    processSyncMutation.mutate();
  };

  const handleSimulateOfflineAction = () => {
    queueActionMutation.mutate({
      actionType: 'quiz_response',
      payload: {
        questionId: `q-${Date.now()}`,
        answer: 'Sample answer',
        timestamp: new Date().toISOString()
      },
      priority: 'high'
    });
  };

  const handleLogConnectionEvent = (eventType: string) => {
    logConnectionMutation.mutate({
      eventType,
      quality: connectionQuality,
      sessionId: `session-${Date.now()}`,
      context: {
        currentQuestionIndex: 5,
        questionsAnswered: 4,
        timeRemaining: 1800
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'syncing': return <Cloud className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offline Sync Manager</h1>
          <p className="text-gray-600">Monitor and manage offline synchronization</p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Badge className="bg-green-100 text-green-800">
              <Wifi className="h-4 w-4 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <WifiOff className="h-4 w-4 mr-1" />
              Offline
            </Badge>
          )}
          <Badge variant="outline">
            Device: {deviceId}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="queue">Sync Queue</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Device Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Offline Mode Supported</span>
                  <Badge variant={deviceStatus?.offlineModeSupported ? 'default' : 'secondary'}>
                    {deviceStatus?.offlineModeSupported ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage</span>
                    <span>
                      {deviceStatus?.storageUsed || 0}MB / {deviceStatus?.storageCapacity || 100}MB
                    </span>
                  </div>
                  <Progress 
                    value={deviceStatus ? (deviceStatus.storageUsed / deviceStatus.storageCapacity) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending Actions</span>
                  <Badge variant="outline">{deviceStatus?.pendingActions || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sync Errors</span>
                  <Badge variant={deviceStatus?.syncErrors ? 'destructive' : 'default'}>
                    {deviceStatus?.syncErrors || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Last Sync</span>
                  <span>{deviceStatus?.lastSyncAt ? new Date(deviceStatus.lastSyncAt).toLocaleString() : 'Never'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Network Status</span>
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Connection Quality</span>
                  <Badge className={`${
                    connectionQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                    connectionQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                    connectionQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {connectionQuality}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleLogConnectionEvent('connected')}
                  >
                    Log Connect
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleLogConnectionEvent('disconnected')}
                  >
                    Log Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sync Queue ({pendingActions.length})</h3>
            <Button 
              onClick={handleProcessSync}
              disabled={processSyncMutation.isPending || !isOnline}
              className="flex items-center space-x-2"
            >
              {processSyncMutation.isPending ? (
                <Cloud className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Process Queue</span>
            </Button>
          </div>

          <div className="space-y-2">
            {pendingActions.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CloudOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending sync actions</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pendingActions.map((action: OfflineAction) => (
                <Card key={action.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(action.status)}
                      <div>
                        <div className="font-medium">{action.actionType}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(action.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(action.priority)}>
                        {action.priority}
                      </Badge>
                      <Badge variant="outline">{action.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Teacher Notifications</h3>
            <Badge variant="outline">
              {teacherNotifications.filter((n: TeacherNotification) => !n.read).length} unread
            </Badge>
          </div>

          {!isTeacher && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Teacher Access Required</AlertTitle>
              <AlertDescription>
                This section is only available for teachers and administrators.
              </AlertDescription>
            </Alert>
          )}

          {isTeacher && (
            <div className="space-y-2">
              {teacherNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                teacherNotifications.map((notification: TeacherNotification) => (
                  <Card key={notification.id} className={notification.read ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(notification.severity)}
                          <div>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markNotificationReadMutation.mutate(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <h3 className="text-lg font-semibold">Testing Tools</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Simulate Offline Actions</CardTitle>
                <CardDescription>
                  Test offline sync by simulating various actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSimulateOfflineAction}
                  disabled={queueActionMutation.isPending}
                  className="w-full"
                >
                  Simulate Quiz Response
                </Button>
                <Button 
                  onClick={() => queueActionMutation.mutate({
                    actionType: 'progress_update',
                    payload: { progress: 75 },
                    priority: 'medium'
                  })}
                  disabled={queueActionMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  Simulate Progress Update
                </Button>
                <Button 
                  onClick={() => queueActionMutation.mutate({
                    actionType: 'proctoring_event',
                    payload: { eventType: 'tab_switch' },
                    priority: 'high'
                  })}
                  disabled={queueActionMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  Simulate Proctoring Event
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Testing</CardTitle>
                <CardDescription>
                  Test connection quality and event logging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Connection Quality</label>
                  <select 
                    value={connectionQuality}
                    onChange={(e) => setConnectionQuality(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <Button 
                  onClick={() => handleLogConnectionEvent('poor_connection')}
                  className="w-full"
                  variant="outline"
                >
                  Log Poor Connection
                </Button>
                <Button 
                  onClick={() => handleLogConnectionEvent('network_error')}
                  className="w-full"
                  variant="outline"
                >
                  Log Network Error
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}