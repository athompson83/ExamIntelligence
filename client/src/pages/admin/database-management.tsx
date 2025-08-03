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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Database, Table as TableIcon, Search, Plus, Edit, Trash2, Play, Download, Upload, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';

interface DatabaseTable {
  name: string;
  rowCount: number;
  size: string;
  lastModified: string;
  schema: string;
}

interface DatabaseQuery {
  id: string;
  query: string;
  executedAt: string;
  executionTime: number;
  rowsAffected: number;
  user: string;
  status: 'success' | 'error';
  error?: string;
}

export default function DatabaseManagement() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("tables");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery<DatabaseTable[]>({
    queryKey: ['/api/super-admin/database/tables'],
    retry: false,
  });

  // Fetch query history
  const { data: queryHistory = [] } = useQuery<DatabaseQuery[]>({
    queryKey: ['/api/super-admin/database/query-history'],
    retry: false,
  });

  // Execute SQL query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/super-admin/database/execute', { query });
      return response;
    },
    onSuccess: (data) => {
      setQueryResults(data.results || []);
      toast({
        title: "Query Executed",
        description: `Query completed successfully. ${data.rowsAffected || 0} rows affected.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/database/query-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Query Failed",
        description: error.message || "Failed to execute query.",
        variant: "destructive",
      });
    },
  });

  // Export table data mutation
  const exportTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const response = await apiRequest('POST', '/api/super-admin/database/export', { tableName });
      return response;
    },
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `${selectedTable} data exported successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export table data.",
        variant: "destructive",
      });
    },
  });

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive",
      });
      return;
    }
    executeQueryMutation.mutate(sqlQuery);
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
  };

  const quickQueries = [
    {
      name: "Show all users",
      query: "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 50;"
    },
    {
      name: "Active quiz sessions",
      query: "SELECT q.title, qa.user_id, qa.started_at, qa.status FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.status = 'in_progress';"
    },
    {
      name: "Recent AI generations",
      query: "SELECT provider, prompt_tokens, completion_tokens, created_at FROM ai_generations ORDER BY created_at DESC LIMIT 20;"
    },
    {
      name: "Account statistics",
      query: "SELECT a.name, COUNT(u.id) as user_count, a.created_at FROM accounts a LEFT JOIN users u ON a.id = u.account_id GROUP BY a.id, a.name, a.created_at;"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
            <p className="text-muted-foreground">
              Direct database access and management for system administrators
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQueryHistory(!showQueryHistory)}>
              Query History
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Query
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>SQL Query Builder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="query">SQL Query</Label>
                    <Textarea
                      id="query"
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="min-h-[200px] font-mono"
                      placeholder="Enter your SQL query here..."
                    />
                  </div>
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      {quickQueries.map((q, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setSqlQuery(q.query)}
                        >
                          {q.name}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={handleExecuteQuery} disabled={executeQueryMutation.isPending}>
                      <Play className="h-4 w-4 mr-2" />
                      {executeQueryMutation.isPending ? 'Executing...' : 'Execute'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tables">Database Tables</TabsTrigger>
              <TabsTrigger value="query">Query Interface</TabsTrigger>
              <TabsTrigger value="results">Query Results</TabsTrigger>
              <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Tables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tablesLoading ? (
                    <div className="text-center py-8">Loading tables...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table Name</TableHead>
                          <TableHead>Schema</TableHead>
                          <TableHead>Row Count</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tables.map((table) => (
                          <TableRow key={table.name}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <TableIcon className="h-4 w-4" />
                                {table.name}
                              </div>
                            </TableCell>
                            <TableCell>{table.schema}</TableCell>
                            <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                            <TableCell>{table.size}</TableCell>
                            <TableCell>{new Date(table.lastModified).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTableSelect(table.name)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportTableMutation.mutate(table.name)}
                                  disabled={exportTableMutation.isPending}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SQL Query Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="table-select">Quick Table Selection</Label>
                      <Select onValueChange={handleTableSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a table to query" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.name} value={table.name}>
                              {table.name} ({table.rowCount} rows)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sql-editor">SQL Query</Label>
                      <Textarea
                        id="sql-editor"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="min-h-[300px] font-mono"
                        placeholder="Enter your SQL query here..."
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSqlQuery('')}
                        >
                          Clear
                        </Button>
                        {quickQueries.map((q, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setSqlQuery(q.query)}
                          >
                            {q.name}
                          </Button>
                        ))}
                      </div>
                      <Button onClick={handleExecuteQuery} disabled={executeQueryMutation.isPending}>
                        <Play className="h-4 w-4 mr-2" />
                        {executeQueryMutation.isPending ? 'Executing...' : 'Execute Query'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {queryResults.length > 0 ? (
                    <div className="overflow-auto max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(queryResults[0] || {}).map((key) => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResults.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No query results to display. Execute a query to see results here.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Database Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create a complete backup of the database including all tables and data.
                    </p>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Create Full Backup
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Database Restore
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Restore database from a backup file. This operation cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Use with extreme caution</span>
                    </div>
                    <Button variant="destructive" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {showQueryHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Query History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Executed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryHistory.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {query.query}
                      </TableCell>
                      <TableCell>{query.user}</TableCell>
                      <TableCell>{new Date(query.executedAt).toLocaleString()}</TableCell>
                      <TableCell>{query.executionTime}ms</TableCell>
                      <TableCell>{query.rowsAffected}</TableCell>
                      <TableCell>
                        <Badge variant={query.status === 'success' ? 'default' : 'destructive'}>
                          {query.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}