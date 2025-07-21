import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Filter, RotateCcw, Search, Shield, Users, Activity, AlertTriangle, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function UserActivityDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    action: "all",
    resource: "all",
    securityLevel: "all",
  });

  // Fetch all users for selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: ['admin', 'super_admin'].includes((user as any)?.role || ''),
  });

  // Fetch activity logs
  const { data: activityLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/activity-logs', selectedUser, dateRange, filters],
    enabled: !!selectedUser,
  });

  // Fetch rollback history
  const { data: rollbackHistory = [] } = useQuery({
    queryKey: ['/api/admin/rollback-history', selectedUser],
    enabled: !!selectedUser,
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery({
    queryKey: ['/api/admin/security-events', selectedUser, dateRange],
    enabled: !!selectedUser,
  });

  // Fetch permission audits
  const { data: permissionAudits = [] } = useQuery({
    queryKey: ['/api/admin/permission-audits', selectedUser, dateRange],
    enabled: !!selectedUser,
  });

  // Fetch user activity summary
  const { data: activitySummary } = useQuery({
    queryKey: ['/api/admin/user-activity-summary', selectedUser],
    enabled: !!selectedUser,
  });

  const handleRollback = async (rollbackId: string) => {
    try {
      const response = await fetch(`/api/admin/execute-rollback/${rollbackId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "Rollback Executed",
          description: "The operation has been successfully rolled back.",
        });
        refetchLogs();
      } else {
        const error = await response.json();
        toast({
          title: "Rollback Failed",
          description: error.message || "Failed to execute rollback.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while executing the rollback.",
        variant: "destructive",
      });
    }
  };

  const exportLogs = () => {
    const exportData = {
      user: selectedUser,
      dateRange,
      activityLogs,
      securityEvents,
      permissionAudits,
      summary: activitySummary,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${selectedUser}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check admin access
  if (!['admin', 'super_admin'].includes((user as any)?.role || '')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need admin privileges to access user activity logs.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {(user as any)?.role || 'unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Activity Dashboard</h1>
          <p className="text-gray-600">Monitor user activities, security events, and manage rollbacks</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} disabled={!selectedUser}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM dd") : "Start date"} - {dateRange.to ? format(dateRange.to, "MMM dd") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => range && setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Security Level</label>
              <Select value={filters.securityLevel} onValueChange={(value) => setFilters({ ...filters, securityLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      {selectedUser && activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Actions</p>
                  <p className="text-lg font-bold">{activitySummary.totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Page Views</p>
                  <p className="text-lg font-bold">{activitySummary.pageViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Button Clicks</p>
                  <p className="text-lg font-bold">{activitySummary.buttonClicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Search className="h-4 w-4 text-orange-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Form Submissions</p>
                  <p className="text-lg font-bold">{activitySummary.formSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Security Events</p>
                  <p className="text-lg font-bold">{activitySummary.securityEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Permission Denials</p>
                  <p className="text-lg font-bold">{activitySummary.permissionDenials}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Logs */}
      {selectedUser && (
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="permissions">Permission Audits</TabsTrigger>
            <TabsTrigger value="rollbacks">Rollback History</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div>
                          <p className="font-medium">{log.resource}</p>
                          <p className="text-sm text-gray-600">{log.pageUrl}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(log.securityLevel)}`}></div>
                        <span className="text-sm text-gray-600">{log.securityLevel}</span>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No activity logs found for the selected criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg border-l-4 border-l-red-500">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">{event.eventType}</p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {event.investigated ? (
                          <Badge variant="outline">Investigated</Badge>
                        ) : (
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {securityEvents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No security events found for the selected criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissionAudits.map((audit: any) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{audit.requestedPermission}</p>
                          <p className="text-sm text-gray-600">Resource: {audit.resource}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(audit.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={audit.granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {audit.granted ? 'Granted' : 'Denied'}
                        </Badge>
                        {!audit.granted && audit.denialReason && (
                          <span className="text-sm text-gray-600">{audit.denialReason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {permissionAudits.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No permission audits found for the selected criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rollbacks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rollback History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rollbackHistory.map((rollback: any) => (
                    <div key={rollback.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <RotateCcw className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">{rollback.operationType} - {rollback.resourceType}</p>
                          <p className="text-sm text-gray-600">{rollback.rollbackDescription}</p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(rollback.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(rollback.expiresAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {rollback.isRolledBack ? (
                          <Badge variant="outline">Executed</Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRollback(rollback.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Execute Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {rollbackHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No rollback history found for the selected user.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedUser && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
            <p className="text-gray-600">Choose a user from the dropdown to view their activity logs and manage rollbacks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}