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
      await apiRequest(`/api/testbanks/${id}`, { method: "DELETE" });
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
      await apiRequest(`/api/testbanks/${id}/revalidate`, { method: "POST" });
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

  const gradients = ['gradient-blue', 'gradient-green', 'gradient-amber', 'gradient-purple'];
  const getGradient = (index: number) => gradients[index % gradients.length];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="relative overflow-hidden rounded-lg h-10 w-64">
            <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl h-12 w-full">
          <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl shadow-lg overflow-hidden relative">
              <div className="h-24 relative overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800 animate-pulse" />
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
              <div className="p-6 space-y-3">
                <div className="relative overflow-hidden rounded-lg h-6 w-3/4">
                  <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                </div>
                <div className="relative overflow-hidden rounded-lg h-4 w-full">
                  <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                </div>
                <div className="relative overflow-hidden rounded-lg h-4 w-2/3">
                  <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Item Banks</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search testbanks by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl shadow-md border-2 focus:border-primary transition-all"
        />
      </div>

      {/* Testbank Grid */}
      {filteredTestbanks.length === 0 ? (
        <Card className="p-12 rounded-2xl shadow-lg text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-blue flex items-center justify-center">
              <FolderOpen className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {searchQuery ? "No testbanks found" : "No testbanks yet"}
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              {searchQuery 
                ? "Try adjusting your search terms or create a new testbank."
                : "Create your first testbank to start building your question library."
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={onCreateNew} 
                className="gradient-blue text-white hover:shadow-xl hover:scale-105 transition-all duration-300 h-12 px-8 rounded-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Testbank
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestbanks.map((testbank, index) => (
            <Card 
              key={testbank.id} 
              className="rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden border-0 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient Header */}
              <div className={`${getGradient(index)} p-6 relative`}>
                <FolderOpen className="absolute top-4 right-4 h-16 w-16 text-white opacity-20" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                    {testbank.title}
                  </h3>
                  <p className="text-sm text-white/80">
                    {testbank.learningObjectives.length} Learning Objectives
                  </p>
                </div>
              </div>
              
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[60px]">
                  {testbank.description || "No description provided"}
                </p>
                
                {/* Tags */}
                {testbank.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {testbank.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0">
                        {tag}
                      </Badge>
                    ))}
                    {testbank.tags.length > 3 && (
                      <Badge className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0">
                        +{testbank.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Footer Metadata */}
                <div className="border-t pt-4 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${testbank.isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span>{testbank.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  <span>Updated {formatDate(testbank.lastRevalidatedAt)}</span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(testbank)}
                    className="flex-1 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(testbank)}
                    className="flex-1 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTestbankMutation.mutate(testbank.id)}
                    disabled={deleteTestbankMutation.isPending}
                    className="rounded-xl hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <Button
        onClick={onCreateNew}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full gradient-blue shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50"
        data-testid="button-create-testbank-fab"
      >
        <Plus className="h-8 w-8 text-white" />
      </Button>
    </div>
  );
}
