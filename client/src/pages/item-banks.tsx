import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, BookOpen, Clock, Tag, Zap, Download, FileText, Upload } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface Testbank {
  id: string;
  title: string;
  description: string;
  subject?: string;
  tags: string[];
  learningObjectives: string[];
  createdAt: string;
  updatedAt: string;
  lastRevalidatedAt: string | null;
  questionCount?: number;
}

export default function ItemBanks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTestbank, setEditingTestbank] = useState<Testbank | null>(null);

  const { data: testbanks, isLoading: testbanksLoading } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: isAuthenticated,
  });

  const createTestbankMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; tags: string[]; learningObjectives: string[] }) => {
      console.log('Creating testbank with data:', data);
      const response = await apiRequest("/api/testbanks", {
        method: "POST",
        body: JSON.stringify(data)
      });
      console.log('Testbank creation response:', response);
      return response.json();
    },
    onSuccess: async (response) => {
      console.log('Testbank creation successful, refreshing cache...');
      
      // Force complete cache refresh
      queryClient.removeQueries({ queryKey: ['/api/testbanks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      
      console.log('Cache refresh completed');
      
      setIsDialogOpen(false);
      setEditingTestbank(null);
      // Reset form by clearing any remaining state
      const form = document.getElementById('create-testbank-form') as HTMLFormElement;
      if (form) form.reset();
      toast({
        title: "Success",
        description: "Item bank created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create item bank",
        variant: "destructive",
      });
    },
  });

  const updateTestbankMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Testbank> }) => {
      const response = await apiRequest(`/api/testbanks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      setEditingTestbank(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Item bank updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update item bank",
        variant: "destructive",
      });
    },
  });

  const deleteTestbankMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/testbanks/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: "User initiated deletion" })
      });
      return response.json();
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/testbanks'] });
      
      // Snapshot the previous value
      const previousTestbanks = queryClient.getQueryData(['/api/testbanks']);
      
      // Optimistically remove the deleted testbank
      queryClient.setQueryData(['/api/testbanks'], (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((testbank: any) => testbank.id !== id);
        }
        return old;
      });
      
      return { previousTestbanks };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousTestbanks) {
        queryClient.setQueryData(['/api/testbanks'], context.previousTestbanks);
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete item bank",
        variant: "destructive",
      });
    },

    onSuccess: async () => {
      // Force immediate cache clearing and refresh
      queryClient.removeQueries({ queryKey: ['/api/testbanks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      toast({
        title: "Success",
        description: "Item bank deleted successfully",
      });
    },
  });

  const exportTestbankMutation = useMutation({
    mutationFn: async ({ id, format }: { id: string; format: string }) => {
      const response = await fetch(`/api/testbanks/${id}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      return { response, format };
    },
    onSuccess: async ({ response, format }, { id }) => {
      const testbank = (testbanks as Testbank[])?.find((t: Testbank) => t.id === id);
      const filename = `${testbank?.title || 'testbank'}_${format}.${format === 'qti' ? 'zip' : format}`;
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Item bank exported as ${format.toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to export item bank",
        variant: "destructive",
      });
    },
  });

  const handleExport = (testbankId: string, format: string) => {
    exportTestbankMutation.mutate({ id: testbankId, format });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
      learningObjectives: (formData.get('learningObjectives') as string).split(',').map(t => t.trim()).filter(t => t),
    };

    if (editingTestbank) {
      updateTestbankMutation.mutate({ id: editingTestbank.id, data });
    } else {
      createTestbankMutation.mutate(data);
    }
  };

  const filteredTestbanks = (testbanks as Testbank[])?.filter((testbank: Testbank) =>
    testbank.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testbank.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || testbanksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
          {/* Mobile-First Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">Item Banks</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your question collections</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setEditingTestbank(null)}
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Item Bank</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTestbank ? 'Edit Item Bank' : 'Create New Item Bank'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTestbank ? 'Update the details of your item bank.' : 'Create a new item bank to organize your questions.'}
                  </DialogDescription>
                </DialogHeader>
                <form id="create-testbank-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      defaultValue={editingTestbank?.title || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingTestbank?.description || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="biology, chemistry, high-school"
                      defaultValue={editingTestbank?.tags?.join(', ') || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="learningObjectives">Learning Objectives (comma-separated)</Label>
                    <Textarea
                      id="learningObjectives"
                      name="learningObjectives"
                      placeholder="Understand photosynthesis, Analyze cell structure"
                      defaultValue={editingTestbank?.learningObjectives?.join(', ') || ''}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createTestbankMutation.isPending || updateTestbankMutation.isPending}>
                      {editingTestbank ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile-Responsive Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <Input
              placeholder="Search item banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-20 pr-4 h-12 text-base btn-mobile"
            />
          </div>

          {/* Mobile: Cards, Desktop: Table */}
          <div className="block lg:hidden space-y-4">
            {filteredTestbanks.map((testbank: Testbank) => (
              <div key={testbank.id} className="mobile-section">
                <div className="mobile-section-content">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{testbank.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{testbank.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant={testbank.subject ? "default" : "secondary"} className="text-xs">
                      {testbank.subject || 'General'}
                    </Badge>
                    {testbank.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {testbank.tags && testbank.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{testbank.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {testbank.questionCount || 0} questions
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(testbank.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation(`/testbanks/${testbank.id}/questions`)}
                      className="flex-1 min-w-0 btn-mobile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingTestbank(testbank); setIsDialogOpen(true); }}
                      className="btn-mobile"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${testbank.title}"? This action cannot be undone.`)) {
                          deleteTestbankMutation.mutate(testbank.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 btn-mobile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                      Item Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Subject & Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Details
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestbanks.map((testbank: Testbank) => (
                    <tr key={testbank.id} className="hover:bg-gray-50 transition-colors">
                      {/* Item Bank Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {testbank.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {testbank.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subject & Tags */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Badge variant={testbank.subject ? "default" : "secondary"} className="text-xs">
                            {testbank.subject || 'General'}
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {testbank.tags?.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {testbank.tags && testbank.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{testbank.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-xs">Created {format(new Date(testbank.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          {testbank.lastRevalidatedAt && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="text-xs">Validated {format(new Date(testbank.lastRevalidatedAt), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {testbank.questionCount || 0} questions
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/testbanks/${testbank.id}/questions`)}
                            className="text-xs"
                          >
                            <BookOpen className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">View Questions</span>
                          </Button>
                          
                          {/* Export Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Download className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Export</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'qti')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                QTI Package (.zip)
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'json')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                JSON Format
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'csv')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                CSV Format
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'xml')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                XML Format
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'canvas')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Canvas Compatible
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'moodle')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Moodle Compatible
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExport(testbank.id, 'blackboard')}
                                disabled={exportTestbankMutation.isPending}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Blackboard Compatible
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "AI Validation",
                                description: "AI validation started for " + testbank.title,
                              });
                            }}
                            className="text-xs"
                          >
                            <Zap className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Revalidate</span>
                          </Button>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTestbank(testbank);
                                setIsDialogOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${testbank.title}"? This action cannot be undone.`)) {
                                  deleteTestbankMutation.mutate(testbank.id);
                                }
                              }}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredTestbanks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No item banks found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No item banks match your search criteria.' : 'Create your first item bank to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Item Bank
                </Button>
              )}
            </div>
          )}
    </Layout>
  );
}
