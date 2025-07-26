import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, DollarSign, Zap, Clock } from "lucide-react";

interface ProviderStatus {
  provider: string;
  available: boolean;
  priority: number;
  costPerToken: number;
}

export default function AIProviderStatus() {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['/api/ai-providers/status'],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading provider status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          No AI providers configured. Please add API keys to enable CAT generation.
        </AlertDescription>
      </Alert>
    );
  }

  const formatCost = (costPerToken: number) => {
    return `$${(costPerToken * 1000000).toFixed(2)}/1M tokens`;
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Primary (Cheapest)";
      case 2: return "Secondary";
      case 3: return "Tertiary";
      case 4: return "Fallback";
      default: return `Priority ${priority}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Provider Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {providers.map((provider: ProviderStatus) => (
            <div key={provider.provider} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                {provider.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium capitalize">{provider.provider}</p>
                  <p className="text-sm text-gray-500">{getPriorityLabel(provider.priority)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={provider.available ? "default" : "secondary"} className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCost(provider.costPerToken)}
                </Badge>
                <Badge variant={provider.available ? "default" : "outline"}>
                  {provider.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <Alert className="mt-4">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Smart Provider Selection:</strong> The system automatically tries providers in cost order 
            (cheapest first) and falls back to alternatives if one fails or reaches quota limits.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}