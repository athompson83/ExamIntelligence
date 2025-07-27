import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Key, CheckCircle, XCircle, Zap, DollarSign, Settings, TestTube, Eye, EyeOff } from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  apiKey: string;
  baseUrl?: string;
  isEnabled: boolean;
  priority: number;
  costPerToken: number;
  maxTokens: number;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastTested?: string;
}

const PROVIDER_CONFIGS = {
  openai: {
    displayName: 'OpenAI GPT-4o',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    costPerToken: 0.000015,
    maxTokens: 4096,
    description: 'Most reliable and versatile. Best for complex reasoning and high-quality outputs.'
  },
  gemini: {
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    costPerToken: 0.00000075,
    maxTokens: 8192,
    description: 'Google\'s multimodal AI. Great balance of speed, cost, and quality.'
  },
  deepseek: {
    displayName: 'Deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    costPerToken: 0.00000014,
    maxTokens: 4096,
    description: 'Most cost-effective option. Excellent for high-volume generation tasks.'
  },
  anthropic: {
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    costPerToken: 0.000015,
    maxTokens: 4096,
    description: 'Superior reasoning and safety. Best for educational content and complex analysis.'
  },
  xai: {
    displayName: 'xAI Grok',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-1212',
    costPerToken: 0.000002,
    maxTokens: 8192,
    description: 'Real-time data access and advanced reasoning with Grok models.'
  },
  groq: {
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    costPerToken: 0.00000059,
    maxTokens: 8192,
    description: 'Ultra-fast inference speed. Ideal for real-time applications and rapid generation.'
  },
  llama: {
    displayName: 'Meta Llama',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    costPerToken: 0.0000009,
    maxTokens: 4096,
    description: 'Open-source large language model. Great for research and educational applications.'
  }
};

export default function LLMProviderManagement() {
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [localApiKeys, setLocalApiKeys] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery<LLMProvider[]>({
    queryKey: ['/api/super-admin/llm-providers'],
    staleTime: 30000,
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (provider: Partial<LLMProvider>) => {
      return apiRequest('/api/super-admin/llm-providers', {
        method: 'POST',
        body: JSON.stringify(provider)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/llm-providers'] });
      toast({
        title: "Provider Updated",
        description: "LLM provider configuration saved successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update provider configuration",
        variant: "destructive"
      });
    }
  });

  const testProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiRequest(`/api/super-admin/llm-providers/${providerId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: (data, providerId) => {
      setTestingProvider(null);
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/llm-providers'] });
      toast({
        title: "Test Successful",
        description: `${PROVIDER_CONFIGS[providerId]?.displayName} is working correctly`
      });
    },
    onError: (error: any, providerId) => {
      setTestingProvider(null);
      toast({
        title: "Test Failed",
        description: `${PROVIDER_CONFIGS[providerId]?.displayName}: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleUpdateProvider = (providerId: string, updates: Partial<LLMProvider>) => {
    const config = PROVIDER_CONFIGS[providerId];
    const provider = {
      id: providerId,
      name: providerId,
      displayName: config.displayName,
      baseUrl: config.baseUrl,
      costPerToken: config.costPerToken,
      maxTokens: config.maxTokens,
      description: config.description,
      ...updates
    };
    updateProviderMutation.mutate(provider);
  };

  const handleTestProvider = (providerId: string) => {
    setTestingProvider(providerId);
    testProviderMutation.mutate(providerId);
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const formatCost = (costPerToken: number) => {
    return `$${(costPerToken * 1000000).toFixed(2)}/1M tokens`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LLM Provider Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading provider configurations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            LLM Provider Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure API keys and settings for AI providers. Use the toggle switches to enable/disable providers. 
            The system automatically selects the best enabled provider based on cost, availability, and task requirements.
          </p>
        </CardHeader>
      </Card>

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Provider Selection:</strong> Providers are automatically prioritized by cost-effectiveness and reliability. 
          The system will fall back to alternative providers if the primary option fails or reaches quota limits.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {Object.entries(PROVIDER_CONFIGS).map(([providerId, config]) => {
          const provider = providers?.find(p => p.id === providerId);
          const isConfigured = !!provider?.apiKey;
          
          return (
            <Card key={providerId} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(provider?.status || 'inactive')}`} />
                    <CardTitle className="text-lg">{config.displayName}</CardTitle>
                    <Badge variant={isConfigured ? "default" : "secondary"}>
                      {isConfigured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCost(config.costPerToken)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider?.isEnabled || false}
                        onCheckedChange={(enabled) => 
                          handleUpdateProvider(providerId, { isEnabled: enabled })
                        }
                        disabled={!isConfigured}
                      />
                      <span className="text-xs text-gray-500">
                        {provider?.isEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{config.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${providerId}-apikey`}>API Key</Label>
                    <div className="relative">
                      <Input
                        id={`${providerId}-apikey`}
                        type={showApiKeys[providerId] ? "text" : "password"}
                        placeholder={`Enter ${config.displayName} API key`}
                        value={localApiKeys[providerId] !== undefined ? localApiKeys[providerId] : (provider?.apiKey || '')}
                        onChange={(e) => {
                          setLocalApiKeys(prev => ({
                            ...prev,
                            [providerId]: e.target.value
                          }));
                        }}
                        onBlur={(e) => {
                          const apiKey = e.target.value.trim();
                          if (apiKey && apiKey !== (provider?.apiKey || '')) {
                            handleUpdateProvider(providerId, { apiKey });
                          }
                        }}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => toggleApiKeyVisibility(providerId)}
                      >
                        {showApiKeys[providerId] ? 
                          <EyeOff className="h-3 w-3" /> : 
                          <Eye className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${providerId}-priority`}>Priority</Label>
                    <Select
                      value={provider?.priority?.toString() || "3"}
                      onValueChange={(value) => 
                        handleUpdateProvider(providerId, { priority: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Highest (Try First)</SelectItem>
                        <SelectItem value="2">2 - High</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Low</SelectItem>
                        <SelectItem value="5">5 - Lowest (Fallback)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTestProvider(providerId)}
                    disabled={!isConfigured || testingProvider === providerId}
                    variant="outline"
                    size="sm"
                  >
                    {testingProvider === providerId ? (
                      <>
                        <TestTube className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>

                  {provider?.lastTested && (
                    <Badge variant="outline" className="text-xs">
                      Last tested: {new Date(provider.lastTested).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {provider?.status === 'error' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Provider not responding. Check API key and network connectivity.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Provider Selection Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Cost Optimization:</strong> System prioritizes lower-cost providers for routine tasks
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Automatic Failover:</strong> Switches to backup providers on quota limits or errors
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Quality Matching:</strong> Uses higher-tier providers for complex educational content
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Performance Monitoring:</strong> Tracks success rates and adjusts provider selection
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}