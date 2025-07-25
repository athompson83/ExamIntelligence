import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Bug, 
  CheckCircle, 
  Clock, 
  Filter,
  Search,
  AlertCircle,
  Shield,
  Zap,
  Info
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const severityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200"
};

const errorTypeIcons = {
  ui: Bug,
  api: Zap,
  validation: AlertTriangle,
  security: Shield,
  performance: Zap,
  general: Info
};

export default function ErrorLogsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedError, setSelectedError] = useState<any>(null);
  const [resolutionText, setResolutionText] = useState("");

  const { data: errorLogs = [], isLoading } = useQuery({
    queryKey: ['/api/error-logs'],
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async ({ errorId, resolution }: { errorId: string; resolution: string }) => {
      return apiRequest(`/api/error-logs/${errorId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution })
      });
    },
    onSuccess: () => {
      toast({
        title: "Error Resolved",
        description: "The error has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/error-logs'] });
      setSelectedError(null);
      setResolutionText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resolve",
        description: "Unable to mark error as resolved. Please try again.",
        variant: "destructive"
      });
    }
  });

  const filteredErrors = errorLogs.filter((error: any) => {
    const matchesFilter = filter === "all" || 
      (filter === "unresolved" && !error.resolved) ||
      (filter === "resolved" && error.resolved) ||
      (filter === error.severity) ||
      (filter === error.error_type);

    const matchesSearch = !searchTerm || 
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleResolveError = () => {
    if (!selectedError || !resolutionText.trim()) return;
    
    resolveErrorMutation.mutate({
      errorId: selectedError.id,
      resolution: resolutionText.trim()
    });
  };

  const getErrorStats = () => {
    const total = errorLogs.length;
    const resolved = errorLogs.filter((e: any) => e.resolved).length;
    const unresolved = total - resolved;
    const critical = errorLogs.filter((e: any) => e.severity === 'critical' && !e.resolved).length;
    
    return { total, resolved, unresolved, critical };
  };

  const stats = getErrorStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Error Logs Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and resolve system errors and user-reported bugs
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Unresolved</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unresolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search errors by message, source, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Errors</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="ui">UI Errors</SelectItem>
                  <SelectItem value="api">API Errors</SelectItem>
                  <SelectItem value="security">Security Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Error Logs ({filteredErrors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No errors found matching your criteria</p>
                </div>
              ) : (
                filteredErrors.map((error: any) => {
                  const ErrorIcon = errorTypeIcons[error.error_type] || Bug;
                  
                  return (
                    <div 
                      key={error.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <ErrorIcon className="h-5 w-5 mt-1 text-gray-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={severityColors[error.severity]}>
                                {error.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {error.error_type}
                              </Badge>
                              {error.resolved && (
                                <Badge className="bg-green-100 text-green-800">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-medium text-gray-900 truncate">
                              {error.message}
                            </h3>
                            
                            <div className="text-sm text-gray-500 mt-1">
                              <p>Source: {error.source}</p>
                              <p>User: {error.user_id}</p>
                              <p>Time: {format(new Date(error.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!error.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedError(error);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Detail Dialog */}
        <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedError && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Bug className="h-5 w-5" />
                    <span>Error Details</span>
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="details" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="stack">Stack Trace</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    {!selectedError.resolved && (
                      <TabsTrigger value="resolve">Resolve</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Error Type</label>
                        <p className="text-sm text-gray-600">{selectedError.error_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Severity</label>
                        <Badge className={severityColors[selectedError.severity]}>
                          {selectedError.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Source</label>
                        <p className="text-sm text-gray-600">{selectedError.source}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">User ID</label>
                        <p className="text-sm text-gray-600">{selectedError.user_id}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Timestamp</label>
                        <p className="text-sm text-gray-600">
                          {format(new Date(selectedError.timestamp), 'EEEE, MMMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Error Message</label>
                      <div className="mt-1 p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm">{selectedError.message}</p>
                      </div>
                    </div>

                    {selectedError.resolved && (
                      <div>
                        <label className="text-sm font-medium">Resolution</label>
                        <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm">{selectedError.resolution}</p>
                          <p className="text-xs text-green-600 mt-2">
                            Resolved by {selectedError.resolved_by} on{" "}
                            {format(new Date(selectedError.resolved_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stack">
                    <div>
                      <label className="text-sm font-medium">Stack Trace</label>
                      <div className="mt-1 p-3 bg-gray-100 rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap">
                          {selectedError.stack_trace || 'No stack trace available'}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metadata">
                    <div>
                      <label className="text-sm font-medium">Additional Metadata</label>
                      <div className="mt-1 p-3 bg-gray-100 rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(selectedError.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {!selectedError.resolved && (
                    <TabsContent value="resolve" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Resolution Notes</label>
                        <Textarea
                          placeholder="Describe how this error was resolved..."
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          className="mt-1"
                          rows={6}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedError(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleResolveError}
                          disabled={!resolutionText.trim() || resolveErrorMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {resolveErrorMutation.isPending ? "Resolving..." : "Mark as Resolved"}
                        </Button>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}