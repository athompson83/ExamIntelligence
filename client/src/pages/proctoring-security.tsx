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
import { AlertTriangle, Shield, Eye, Clock, CheckCircle, XCircle, Activity, Users, AlertCircle } from "lucide-react";
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

export default function ProctoringSecurity() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'active'>('all');
  
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
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

  if (dashboardLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proctoring Security Center</h1>
          <p className="text-muted-foreground">Monitor exam security and manage proctoring alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedFilter} onValueChange={(value: 'all' | 'critical' | 'active') => setSelectedFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter alerts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="active">Active Alerts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently being monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardData?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData?.criticalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">High priority incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData?.totalAlertsToday || 0}</div>
            <p className="text-xs text-muted-foreground">In the last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Proctor Alerts</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="live">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proctoring Alerts</CardTitle>
              <CardDescription>
                Monitor and resolve proctoring alerts from active and completed exams
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
                        <TableHead>Student</TableHead>
                        <TableHead>Alert Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proctorAlerts?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No proctoring alerts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        proctorAlerts?.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.studentId}</TableCell>
                            <TableCell>{alert.alertType}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(alert.severity)}
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                            <TableCell>
                              {alert.resolved ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(alert.createdAt), "MMM dd, HH:mm")}
                            </TableCell>
                            <TableCell>
                              {!alert.resolved ? (
                                <ProctorAlertResolver
                                  alert={alert}
                                  onResolve={() => {}}
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Resolved by {alert.resolvedBy}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                View all security events logged during exam sessions
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
                        <TableHead>User</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No security events found
                          </TableCell>
                        </TableRow>
                      ) : (
                        securityEvents?.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.userId}</TableCell>
                            <TableCell>{event.eventType}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(event.severity)}
                                <Badge className={getSeverityColor(event.severity)}>
                                  {event.severity}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                            <TableCell className="font-mono text-sm">{event.sessionId}</TableCell>
                            <TableCell>
                              {format(new Date(event.timestamp), "MMM dd, HH:mm:ss")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Monitoring</CardTitle>
              <CardDescription>
                Real-time view of active exam sessions and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Security Events</h3>
                  {dashboardData?.recentEvents.length === 0 ? (
                    <p className="text-muted-foreground">No recent security events</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData?.recentEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {getSeverityIcon(event.severity)}
                          <div className="flex-1">
                            <p className="font-medium">{event.eventType}</p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.timestamp), "HH:mm:ss")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Alerts</h3>
                  {dashboardData?.recentAlerts.length === 0 ? (
                    <p className="text-muted-foreground">No recent alerts</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData?.recentAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <p className="font-medium">{alert.alertType}</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                          </div>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.resolved ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Resolved
                            </Badge>
                          ) : (
                            <ProctorAlertResolver
                              alert={alert}
                              onResolve={() => {}}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}