import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus } from "lucide-react";
import { Testbank } from "@/types";

const testbankSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

type TestbankFormData = z.infer<typeof testbankSchema>;

interface TestbankEditorProps {
  testbank?: Testbank;
  onSave: (testbank: Testbank) => void;
  onCancel: () => void;
}

export function TestbankEditor({ testbank, onSave, onCancel }: TestbankEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestbankFormData>({
    resolver: zodResolver(testbankSchema),
    defaultValues: {
      title: testbank?.title || "",
      description: testbank?.description || "",
      tags: testbank?.tags || [],
      learningObjectives: testbank?.learningObjectives || [],
      isPublic: testbank?.isPublic || false,
    },
  });

  const tags = watch("tags");
  const learningObjectives = watch("learningObjectives");

  const createTestbankMutation = useMutation({
    mutationFn: async (data: TestbankFormData) => {
      const response = await apiRequest("/api/testbanks", { method: "POST", body: JSON.stringify(data) });
      return response.json();
    },
    onSuccess: (newTestbank) => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks"] });
      toast({
        title: "Success",
        description: "Testbank created successfully",
      });
      onSave(newTestbank);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create testbank",
        variant: "destructive",
      });
    },
  });

  const updateTestbankMutation = useMutation({
    mutationFn: async (data: TestbankFormData) => {
      const response = await apiRequest(`/api/testbanks/${testbank!.id}`, { method: "PUT", body: JSON.stringify(data) });
      return response.json();
    },
    onSuccess: (updatedTestbank) => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks"] });
      toast({
        title: "Success",
        description: "Testbank updated successfully",
      });
      onSave(updatedTestbank);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update testbank",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestbankFormData) => {
    if (testbank) {
      updateTestbankMutation.mutate(data);
    } else {
      createTestbankMutation.mutate(data);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove));
  };

  const addObjective = () => {
    if (objectiveInput.trim() && !learningObjectives.includes(objectiveInput.trim())) {
      setValue("learningObjectives", [...learningObjectives, objectiveInput.trim()]);
      setObjectiveInput("");
    }
  };

  const removeObjective = (objectiveToRemove: string) => {
    setValue("learningObjectives", learningObjectives.filter(obj => obj !== objectiveToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleObjectiveInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addObjective();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {testbank ? "Edit Testbank" : "Create New Testbank"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter testbank title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter testbank description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add tags (press Enter)"
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={handleObjectiveInputKeyPress}
                placeholder="Add learning objectives (press Enter)"
              />
              <Button type="button" onClick={addObjective} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {learningObjectives.length > 0 && (
              <div className="space-y-2 mt-2">
                {learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{objective}</span>
                    <button
                      type="button"
                      onClick={() => removeObjective(objective)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              {...register("isPublic")}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
            <Label htmlFor="isPublic">Make this testbank public</Label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTestbankMutation.isPending || updateTestbankMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createTestbankMutation.isPending || updateTestbankMutation.isPending
                ? "Saving..."
                : testbank ? "Update Testbank" : "Create Testbank"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
