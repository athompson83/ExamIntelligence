import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, FolderOpen, FileText, Link as LinkIcon, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReferenceBank, Reference } from "@shared/schema";

interface ReferenceBankWithReferences extends ReferenceBank {
  references?: Reference[];
}

export default function ReferenceBanks() {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isCreateBankOpen, setIsCreateBankOpen] = useState(false);
  const [isCreateReferenceOpen, setIsCreateReferenceOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<ReferenceBank | null>(null);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reference banks
  const { data: referenceBanks = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ["/api/reference-banks"],
  });

  // Fetch references for selected bank
  const { data: references = [], isLoading: isLoadingReferences } = useQuery({
    queryKey: ["/api/reference-banks", selectedBank, "references"],
    enabled: !!selectedBank,
  });

  // Bank mutations
  const createBankMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; tags: string[] }) => {
      return apiRequest("POST", "/api/reference-banks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks"] });
      setIsCreateBankOpen(false);
      toast({ title: "Success", description: "Reference bank created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create reference bank", variant: "destructive" });
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReferenceBank> }) => {
      return apiRequest("PATCH", `/api/reference-banks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks"] });
      setEditingBank(null);
      toast({ title: "Success", description: "Reference bank updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update reference bank", variant: "destructive" });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reference-banks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks"] });
      if (selectedBank === editingBank?.id) {
        setSelectedBank(null);
      }
      toast({ title: "Success", description: "Reference bank deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reference bank", variant: "destructive" });
    },
  });

  // Reference mutations
  const createReferenceMutation = useMutation({
    mutationFn: async (data: { title: string; type: string; content: string; url?: string; tags: string[] }) => {
      return apiRequest("POST", `/api/reference-banks/${selectedBank}/references`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks", selectedBank, "references"] });
      setIsCreateReferenceOpen(false);
      toast({ title: "Success", description: "Reference created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create reference", variant: "destructive" });
    },
  });

  const updateReferenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reference> }) => {
      return apiRequest("PATCH", `/api/references/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks", selectedBank, "references"] });
      setEditingReference(null);
      toast({ title: "Success", description: "Reference updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update reference", variant: "destructive" });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/references/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-banks", selectedBank, "references"] });
      toast({ title: "Success", description: "Reference deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reference", variant: "destructive" });
    },
  });

  const handleCreateBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()) : [];
    
    createBankMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      tags,
    });
  };

  const handleEditBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBank) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()) : [];
    
    updateBankMutation.mutate({
      id: editingBank.id,
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        tags,
      },
    });
  };

  const handleCreateReference = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()) : [];
    
    const referenceData = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      content: formData.get("content") as string,
      url: formData.get("url") as string || undefined,
      tags,
    };
    
    createReferenceMutation.mutate(referenceData);
  };

  const handleEditReference = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingReference) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()) : [];
    
    updateReferenceMutation.mutate({
      id: editingReference.id,
      data: {
        title: formData.get("title") as string,
        type: formData.get("type") as string,
        content: formData.get("content") as string,
        url: formData.get("url") as string || undefined,
        tags,
      },
    });
  };

  const selectedBankData = referenceBanks.find((bank: ReferenceBank) => bank.id === selectedBank);

  if (isLoadingBanks) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reference Banks</h1>
          <p className="text-muted-foreground">Organize and manage your reference materials</p>
        </div>
        <Dialog open={isCreateBankOpen} onOpenChange={setIsCreateBankOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reference Bank</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="education, research, science" />
              </div>
              <Button type="submit" disabled={createBankMutation.isPending}>
                {createBankMutation.isPending ? "Creating..." : "Create Bank"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Reference Banks</CardTitle>
              <CardDescription>Your reference material collections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {referenceBanks.map((bank: ReferenceBank) => (
                <div
                  key={bank.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBank === bank.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedBank(bank.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4" />
                      <span className="font-medium">{bank.title}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingBank(bank)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteBankMutation.mutate(bank.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {bank.description && (
                    <p className="text-sm text-muted-foreground mt-1">{bank.description}</p>
                  )}
                  {bank.tags && bank.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bank.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {bank.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{bank.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* References List */}
        <div className="lg:col-span-2">
          {selectedBank ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedBankData?.title}</CardTitle>
                    <CardDescription>{selectedBankData?.description}</CardDescription>
                  </div>
                  <Dialog open={isCreateReferenceOpen} onOpenChange={setIsCreateReferenceOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reference
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Reference</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateReference} className="space-y-4">
                        <div>
                          <Label htmlFor="ref-title">Title</Label>
                          <Input id="ref-title" name="title" required />
                        </div>
                        <div>
                          <Label htmlFor="ref-type">Type</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reference type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="research">Research Paper</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ref-url">URL (optional)</Label>
                          <Input id="ref-url" name="url" type="url" />
                        </div>
                        <div>
                          <Label htmlFor="ref-content">Content/Notes</Label>
                          <Textarea id="ref-content" name="content" rows={4} required />
                        </div>
                        <div>
                          <Label htmlFor="ref-tags">Tags (comma-separated)</Label>
                          <Input id="ref-tags" name="tags" placeholder="research, methodology, data" />
                        </div>
                        <Button type="submit" disabled={createReferenceMutation.isPending}>
                          {createReferenceMutation.isPending ? "Adding..." : "Add Reference"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingReferences ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : references.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No references in this bank yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {references.map((reference: Reference) => (
                      <Card key={reference.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {reference.type === "website" ? (
                                <LinkIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <h3 className="font-medium">{reference.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {reference.type}
                              </Badge>
                            </div>
                            {reference.url && (
                              <a
                                href={reference.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mb-2 block"
                              >
                                {reference.url}
                              </a>
                            )}
                            <p className="text-sm text-muted-foreground mb-2">{reference.content}</p>
                            {reference.tags && reference.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {reference.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setEditingReference(reference)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteReferenceMutation.mutate(reference.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Reference Bank</h3>
                  <p className="text-muted-foreground">
                    Choose a reference bank from the left panel to view and manage its references
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Bank Dialog */}
      {editingBank && (
        <Dialog open={!!editingBank} onOpenChange={() => setEditingBank(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Reference Bank</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBank} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" defaultValue={editingBank.title} required />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={editingBank.description || ""} />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  defaultValue={editingBank.tags?.join(", ") || ""}
                  placeholder="education, research, science"
                />
              </div>
              <Button type="submit" disabled={updateBankMutation.isPending}>
                {updateBankMutation.isPending ? "Updating..." : "Update Bank"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Reference Dialog */}
      {editingReference && (
        <Dialog open={!!editingReference} onOpenChange={() => setEditingReference(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Reference</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditReference} className="space-y-4">
              <div>
                <Label htmlFor="edit-ref-title">Title</Label>
                <Input id="edit-ref-title" name="title" defaultValue={editingReference.title} required />
              </div>
              <div>
                <Label htmlFor="edit-ref-type">Type</Label>
                <Select name="type" defaultValue={editingReference.type} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="research">Research Paper</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-ref-url">URL (optional)</Label>
                <Input id="edit-ref-url" name="url" type="url" defaultValue={editingReference.url || ""} />
              </div>
              <div>
                <Label htmlFor="edit-ref-content">Content/Notes</Label>
                <Textarea id="edit-ref-content" name="content" rows={4} defaultValue={editingReference.content} required />
              </div>
              <div>
                <Label htmlFor="edit-ref-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-ref-tags"
                  name="tags"
                  defaultValue={editingReference.tags?.join(", ") || ""}
                  placeholder="research, methodology, data"
                />
              </div>
              <Button type="submit" disabled={updateReferenceMutation.isPending}>
                {updateReferenceMutation.isPending ? "Updating..." : "Update Reference"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}