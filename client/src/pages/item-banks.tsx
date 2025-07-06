import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}

export default function ItemBanks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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
      await apiRequest("POST", "/api/testbanks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      setIsDialogOpen(false);
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
      await apiRequest("PUT", `/api/testbanks/${id}`, data);
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
      await apiRequest("DELETE", `/api/testbanks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      toast({
        title: "Success",
        description: "Item bank deleted successfully",
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
        description: "Failed to delete item bank",
        variant: "destructive",
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
      const testbank = testbanks?.find((t: Testbank) => t.id === id);
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

  const filteredTestbanks = testbanks?.filter((testbank: Testbank) =>
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
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Item Banks</h1>
              <p className="text-gray-600">Manage your question collections</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setEditingTestbank(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Item Bank
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTestbank ? 'Edit Item Bank' : 'Create New Item Bank'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search item banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Item Banks Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject & Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            onClick={() => window.location.href = `/testbanks/${testbank.id}/questions`}
                            className="text-xs"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            View Questions
                          </Button>
                          
                          {/* Export Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                Export
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
                            <Zap className="h-3 w-3 mr-1" />
                            Revalidate
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
                              onClick={() => deleteTestbankMutation.mutate(testbank.id)}
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
        </main>
      </div>
    </div>
  );
}
