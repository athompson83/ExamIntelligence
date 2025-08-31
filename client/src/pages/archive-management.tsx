import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Archive, RotateCcw, Trash2, History, FileText, Brain, HelpCircle, Search, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

interface ArchivedItem {
  id: string;
  title: string;
  type: string;
  archivedAt: string;
  archivedBy: string;
  archiveReason: string;
  canRestore: boolean;
  questionCount?: number;
  questionText?: string;
  originalData?: any;
}

interface ArchiveHistoryItem {
  id: string;
  itemType: string;
  itemId: string;
  itemTitle: string;
  action: string;
  performedBy: string;
  reason: string;
  timestamp: string;
}

export default function ArchiveManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [restoreReason, setRestoreReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<ArchivedItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch archived items
  const { data: archivedQuestions = [] } = useQuery({
    queryKey: ['archived-questions'],
    queryFn: () => apiRequest('/api/archive/questions'),
  });

  const { data: archivedQuizzes = [] } = useQuery({
    queryKey: ['archived-quizzes'],
    queryFn: () => apiRequest('/api/archive/quizzes'),
  });

  const { data: archivedTestbanks = [] } = useQuery({
    queryKey: ['archived-testbanks'],
    queryFn: () => apiRequest('/api/archive/testbanks'),
  });

  // Fetch archive history
  const { data: archiveHistoryResponse } = useQuery({
    queryKey: ['archive-history', selectedItemForHistory?.id],
    queryFn: () => apiRequest(`/api/archive/history?itemId=${selectedItemForHistory?.id}`),
    enabled: !!selectedItemForHistory,
  });
  
  const archiveHistory = Array.isArray(archiveHistoryResponse) ? archiveHistoryResponse : [];

  // Restore mutations
  const restoreQuestionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/restore/question/${id}`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Success", description: "Question restored successfully" });
      queryClient.invalidateQueries({ queryKey: ['archived-questions'] });
      queryClient.invalidateQueries({ queryKey: ['testbanks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore question", variant: "destructive" });
    },
  });

  const restoreQuizMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/restore/quiz/${id}`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Success", description: "Quiz restored successfully" });
      queryClient.invalidateQueries({ queryKey: ['archived-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore quiz", variant: "destructive" });
    },
  });

  const restoreTestbankMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/restore/testbank/${id}`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Success", description: "Testbank restored successfully" });
      queryClient.invalidateQueries({ queryKey: ['archived-testbanks'] });
      queryClient.invalidateQueries({ queryKey: ['testbanks'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore testbank", variant: "destructive" });
    },
  });

  // Permanent delete mutations
  const permanentDeleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => 
      apiRequest(`/api/archive/permanent/${type}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: "Success", description: "Item permanently deleted" });
      queryClient.invalidateQueries({ queryKey: ['archived-questions'] });
      queryClient.invalidateQueries({ queryKey: ['archived-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['archived-testbanks'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to permanently delete item", variant: "destructive" });
    },
  });

  // Combine all archived items
  const allArchivedItems: ArchivedItem[] = [
    ...(Array.isArray(archivedQuestions) ? archivedQuestions.map((q: any) => ({ ...q, type: 'question' })) : []),
    ...(Array.isArray(archivedQuizzes) ? archivedQuizzes.map((q: any) => ({ ...q, type: 'quiz' })) : []),
    ...(Array.isArray(archivedTestbanks) ? archivedTestbanks.map((t: any) => ({ ...t, type: 'testbank' })) : []),
  ];

  // Filter archived items
  const filteredItems = allArchivedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.archiveReason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleRestore = (item: ArchivedItem) => {
    switch (item.type) {
      case 'question':
        restoreQuestionMutation.mutate(item.id);
        break;
      case 'quiz':
        restoreQuizMutation.mutate(item.id);
        break;
      case 'testbank':
        restoreTestbankMutation.mutate(item.id);
        break;
    }
  };

  const handlePermanentDelete = (item: ArchivedItem) => {
    permanentDeleteMutation.mutate({ type: item.type, id: item.id });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="h-4 w-4" />;
      case 'quiz':
        return <FileText className="h-4 w-4" />;
      case 'testbank':
        return <Brain className="h-4 w-4" />;
      default:
        return <Archive className="h-4 w-4" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quiz':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'testbank':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'archived':
        return <Archive className="h-4 w-4 text-orange-500" />;
      case 'restored':
        return <RotateCcw className="h-4 w-4 text-green-500" />;
      case 'permanently_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Archive className="h-8 w-8" />
            Archive Management
          </h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredItems.length} Archived Items
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Safety Archive System</CardTitle>
          <CardDescription>
            Items are archived instead of permanently deleted for safety. You can restore them anytime or permanently delete them if needed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Archives</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="filter">Filter by Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="question">Questions</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="testbank">Testbanks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Archive Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{Array.isArray(archivedQuestions) ? archivedQuestions.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Quizzes</p>
                <p className="text-2xl font-bold">{Array.isArray(archivedQuizzes) ? archivedQuizzes.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Testbanks</p>
                <p className="text-2xl font-bold">{Array.isArray(archivedTestbanks) ? archivedTestbanks.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{allArchivedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archived Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Items</CardTitle>
          <CardDescription>
            View and manage all archived content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No archived items found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {getItemIcon(item.type)}
                        <Badge className={getItemTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Archived {format(new Date(item.archivedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {item.archiveReason}
                      </p>
                      {item.questionCount && (
                        <p className="text-sm text-muted-foreground">
                          {item.questionCount} questions
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItemForHistory(item);
                          setHistoryDialogOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {item.canRestore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the {item.type} "{item.title}" and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(item)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Permanently Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archive History</DialogTitle>
            <DialogDescription>
              Complete history for: {selectedItemForHistory?.title}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {archiveHistory.map((historyItem: ArchiveHistoryItem) => (
                <div key={historyItem.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getActionIcon(historyItem.action)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium capitalize">{historyItem.action}</span>
                      <span className="text-sm text-muted-foreground">
                        by {historyItem.performedBy}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {format(new Date(historyItem.timestamp), 'MMM d, yyyy HH:mm')}
                    </p>
                    {historyItem.reason && (
                      <p className="text-sm">{historyItem.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}