import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Settings, Code, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function BackendPromptTestPage() {
  const [filterCategory, setFilterCategory] = useState("all");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Fetch backend prompts
  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ["/api/backend-prompts"],
    queryFn: () => apiRequest("GET", "/api/backend-prompts"),
    enabled: user?.role === "super_admin",
  });

  // Security check
  if (user?.role !== "super_admin") {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only super administrators can access backend prompt management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load prompts: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backend Prompt Management Test</h1>
          <p className="text-muted-foreground">
            Testing backend prompt management functionality
          </p>
        </div>
      </div>

      {/* Debug information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>User Role:</strong> {user?.role}</p>
            <p><strong>Prompts Data:</strong> {prompts ? `${prompts.length} items` : 'null'}</p>
            <p><strong>Is Array:</strong> {Array.isArray(prompts) ? 'true' : 'false'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'true' : 'false'}</p>
            <p><strong>Error:</strong> {error ? error.message : 'none'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Prompts display */}
      <div className="grid gap-4">
        {Array.isArray(prompts) && prompts.length > 0 ? (
          prompts.map((prompt: any) => (
            <Card key={prompt.id}>
              <CardHeader>
                <CardTitle className="text-lg">{prompt.name}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="outline">{prompt.category}</Badge>
                    <Badge variant={prompt.isActive ? "default" : "secondary"}>
                      {prompt.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {prompt.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Variables: {prompt.variables?.join(", ") || "None"}
                  </p>
                  {prompt.usage && (
                    <div className="text-sm text-muted-foreground">
                      <p>Total Calls: {prompt.usage.totalCalls}</p>
                      <p>Success Rate: {prompt.usage.successRate}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
              <p className="text-muted-foreground">
                {Array.isArray(prompts) ? "No prompts available" : "Failed to load prompts"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}