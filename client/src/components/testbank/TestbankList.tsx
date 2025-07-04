import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Plus, Edit, Trash2, RefreshCw, Eye, FolderOpen } from "lucide-react";
import { Testbank } from "@/types";

interface TestbankListProps {
  onCreateNew: () => void;
  onEdit: (testbank: Testbank) => void;
  onView: (testbank: Testbank) => void;
}

export function TestbankList({ onCreateNew, onEdit, onView }: TestbankListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testbanks, isLoading } = useQuery<Testbank[]>({
    queryKey: ["/api/testbanks"],
  });

  const deleteTestbankMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/testbanks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks"] });
      toast({
        title: "Success",
        description: "Testbank deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete testbank",
        variant: "destructive",
      });
    },
  });

  const revalidateTestbankMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/testbanks/${id}/revalidate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks"] });
      toast({
        title: "Success",
        description: "Testbank revalidation started",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start revalidation",
        variant: "destructive",
      });
    },
  });

  const filteredTestbanks = testbanks?.filter(testbank =>
    testbank.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testbank.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testbank.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const formatDate = (date: Date | null): string => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Item Banks</h2>
        <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create New Testbank
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search testbanks by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Testbank Grid */}
      {filteredTestbanks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No testbanks found" : "No testbanks yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search terms or create a new testbank."
                : "Create your first testbank to start building your question library."
              }
            </p>
            {!searchQuery && (
              <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create New Testbank
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestbanks.map((testbank) => (
            <Card key={testbank.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                      {testbank.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(testbank.createdAt)}
                    </p>
                  </div>
                  {testbank.isPublic && (
                    <Badge variant="secondary" className="ml-2">
                      Public
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {testbank.description || "No description provided"}
                </p>
                
                {/* Tags */}
                {testbank.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {testbank.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {testbank.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{testbank.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Stats */}
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Learning Objectives: {testbank.learningObjectives.length}</p>
                  <p>Last Revalidated: {formatDate(testbank.lastRevalidatedAt)}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(testbank)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(testbank)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTestbankMutation.mutate(testbank.id)}
                      disabled={deleteTestbankMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revalidateTestbankMutation.mutate(testbank.id)}
                    disabled={revalidateTestbankMutation.isPending}
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${revalidateTestbankMutation.isPending ? 'animate-spin' : ''}`} />
                    Revalidate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
