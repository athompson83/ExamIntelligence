import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, Eye, Clock, CheckCircle, XCircle, Activity, Users, AlertCircle, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface SecurityEvent {
  id: string;
  userId: string;
  examId: string;
  sessionId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  browserFingerprint?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface ProctorAlert {
  id: string;
  studentId: string;
  examId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: any;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  activeSessions: number;
  activeAlerts: number;
  criticalEvents: number;
  totalAlertsToday: number;
  recentEvents: SecurityEvent[];
  recentAlerts: ProctorAlert[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />;
    case 'medium': return <Eye className="h-4 w-4 text-yellow-600" />;
    case 'low': return <Activity className="h-4 w-4 text-green-600" />;
    default: return <Shield className="h-4 w-4 text-gray-600" />;
  }
};

function ProctorAlertResolver({ alert, onResolve }: { alert: ProctorAlert, onResolve: () => void }) {
  const [resolution, setResolution] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, resolution }: { alertId: string, resolution: string }) => {
      return await apiRequest(`/api/proctor-alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proctoring/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proctor-alerts'] });
      setIsOpen(false);
      setResolution("");
      onResolve();
    }
  });

  const handleResolve = () => {
    if (resolution.trim()) {
      resolveMutation.mutate({ alertId: alert.id, resolution });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle className="h-4 w-4 mr-1" />
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Resolve Proctor Alert</DialogTitle>
          <DialogDescription>
            Provide a resolution for this alert. This will mark it as resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Alert Details</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{alert.alertType}</p>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {getSeverityIcon(alert.severity)}
                <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution Details</Label>
            <Textarea
              id="resolution"
              placeholder="Describe how this alert was resolved..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleResolve}
            disabled={!resolution.trim() || resolveMutation.isPending}
          >
            {resolveMutation.isPending ? "Resolving..." : "Mark Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProctoringDashboardWindow() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'active'>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/proctoring/dashboard'],
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  const { data: securityEvents, isLoading: eventsLoading } = useQuery<SecurityEvent[]>({
    queryKey: ['/api/security-events', selectedFilter],
    queryFn: () => {
      const params = selectedFilter === 'critical' ? '?severity=critical' : '';
      return apiRequest(`/api/security-events${params}`);
    }
  });

  const { data: proctorAlerts, isLoading: alertsLoading } = useQuery<ProctorAlert[]>({
    queryKey: ['/api/proctor-alerts', selectedFilter],
    queryFn: () => {
      const params = selectedFilter === 'active' ? '?active=true' : '';
      return apiRequest(`/api/proctor-alerts${params}`);
    }
  });

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    // Set page title for window mode
    document.title = "Proctoring Dashboard - ProficiencyAI";
    
    // Add window-specific styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    return () => {
      document.title = "ProficiencyAI";
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">Loading Proctoring Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Proctoring Dashboard</h1>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleMinimize}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className={`p-6 ${isMinimized ? 'hidden' : ''}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData?.activeSessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData?.activeAlerts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical Events</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardData?.criticalEvents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Alerts</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData?.totalAlertsToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="alerts">Proctor Alerts</TabsTrigger>
              <TabsTrigger value="events">Security Events</TabsTrigger>
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            </TabsList>
            
            <Select value={selectedFilter} onValueChange={(value: 'all' | 'critical' | 'active') => setSelectedFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Proctor Alerts</CardTitle>
                <CardDescription>
                  Monitor and resolve proctoring violations and suspicious activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alert Type</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proctorAlerts?.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.alertType}</TableCell>
                            <TableCell>{alert.studentId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(alert.severity)}
                                <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>{alert.description}</TableCell>
                            <TableCell>{format(new Date(alert.createdAt), 'HH:mm:ss')}</TableCell>
                            <TableCell>
                              {alert.resolved ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!alert.resolved && (
                                <ProctorAlertResolver 
                                  alert={alert} 
                                  onResolve={() => {
                                    // Refresh data
                                    handleRefresh();
                                  }} 
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>
                  Real-time security monitoring and event logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Type</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityEvents?.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.eventType}</TableCell>
                            <TableCell>{event.userId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(event.severity)}
                                <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>{event.description}</TableCell>
                            <TableCell>{format(new Date(event.timestamp), 'HH:mm:ss')}</TableCell>
                            <TableCell className="font-mono text-sm">{event.ipAddress || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Currently active exam sessions being monitored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active sessions at the moment</p>
                  <p className="text-sm">Sessions will appear here when students start taking exams</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}