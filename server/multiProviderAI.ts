import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIProvider {
  name: string;
  priority: number;
  available: boolean;
  costPerToken: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  tokensUsed?: number;
  cost?: number;
}

class MultiProviderAI {
  private providers: Map<string, any> = new Map();
  private providerConfigs: AIProvider[] = [
    { name: 'deepseek', priority: 1, available: true, costPerToken: 0.00000014 }, // Cheapest
    { name: 'gemini', priority: 2, available: true, costPerToken: 0.00000075 }, // Mid-range
    { name: 'xai', priority: 3, available: true, costPerToken: 0.000002 }, // xAI Grok
    { name: 'openai', priority: 4, available: true, costPerToken: 0.000015 }, // Most expensive
    { name: 'anthropic', priority: 5, available: true, costPerToken: 0.000015 }
  ];

  constructor() {
    this.initializeProviders();
  }
  
  // Reinitialize providers when called
  async reinitialize() {
    this.providers.clear();
    await this.initializeProviders();
  }

  private async initializeProviders() {
    // Get API keys from database storage
    const { DatabaseStorage } = await import('./storage-simple');
    const storage = new DatabaseStorage();
    
    try {
      const providers = await storage.getAllLLMProviders();
      console.log('🔍 Available providers from database:', providers.map(p => ({ 
        id: p.id, 
        hasApiKey: !!p.apiKey, 
        keyLength: p.apiKey ? p.apiKey.length : 0,
        isEnabled: p.isEnabled 
      })));
      
      for (const provider of providers) {
        // Skip if no API key or explicitly disabled
        if (!provider.apiKey || provider.isEnabled === false) {
          console.log(`⏭️ Skipping ${provider.id}: apiKey=${!!provider.apiKey}, isEnabled=${provider.isEnabled}`);
          continue;
        }
        
        console.log(`✅ Initializing ${provider.id} provider`);
        
        switch (provider.id) {
          case 'openai':
            if (provider.apiKey) {
              this.providers.set('openai', new OpenAI({ apiKey: provider.apiKey }));
            }
            break;
            
          case 'google':
            if (provider.apiKey) {
              this.providers.set('gemini', new GoogleGenAI({ apiKey: provider.apiKey }));
            }
            break;
            
          case 'anthropic':
            if (provider.apiKey) {
              this.providers.set('anthropic', new Anthropic({ apiKey: provider.apiKey }));
            }
            break;
            
          case 'deepseek':
            if (provider.apiKey) {
              this.providers.set('deepseek', new OpenAI({
                apiKey: provider.apiKey,
                baseURL: 'https://api.deepseek.com/v1'
              }));
            }
            break;
            
          case 'xai':
            if (provider.apiKey) {
              this.providers.set('xai', new OpenAI({
                apiKey: provider.apiKey,
                baseURL: 'https://api.x.ai/v1'
              }));
            }
            break;
        }
      }
      console.log(`🎯 Total providers initialized: ${this.providers.size}`);
    } catch (error) {
      console.error('Failed to initialize providers from database:', error);
      // Fallback to environment variables
      if (process.env.OPENAI_API_KEY) {
        this.providers.set('openai', new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
      }
    }
  }

  private getAvailableProviders(): string[] {
    return this.providerConfigs
      .filter(config => this.providers.has(config.name))
      .sort((a, b) => a.priority - b.priority)
      .map(config => config.name);
  }

  async generateCATExam(prompt: string, options: any): Promise<AIResponse> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available. Please configure API keys.');
    }

    let lastError: Error | null = null;

    // Try each provider in priority order (cheapest first)
    for (const providerName of availableProviders) {
      try {
        console.log(`🔄 Attempting CAT generation with ${providerName}...`);
        const response = await this.callProvider(providerName, options.messages || [], options);
        console.log(`✅ Successfully generated with ${providerName}`);
        return response;
      } catch (error: any) {
        console.warn(`❌ ${providerName} failed:`, error.message);
        lastError = error;
        
        // Skip to next provider on quota/rate limit errors
        if (error.status === 429 || error.code === 'insufficient_quota') {
          continue;
        }
        
        // For other errors, try next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private async callProvider(providerName: string, messages: any[], options: any): Promise<AIResponse> {
    const provider = this.providers.get(providerName);
    
    switch (providerName) {
      case 'openai':
        return this.callOpenAI(provider, messages, options);
      
      case 'gemini':
        return this.callGemini(provider, messages, options);
      
      case 'deepseek':
        return this.callDeepseek(provider, messages, options);
      
      case 'anthropic':
        return this.callAnthropic(provider, messages, options);
      
      case 'xai':
        return this.callXAI(provider, messages, options);
      
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  async generateContent(options: any): Promise<AIResponse> {
    // Reinitialize providers to get latest API keys from database
    console.log('🔄 Reinitializing providers for content generation...');
    await this.initializeProviders();
    console.log(`🎯 Providers available after reinit: ${this.providers.size}`);
    return this.generateCATExam('', options);
  }

  private async callOpenAI(client: OpenAI, messages: any[], options: any): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages,
      response_format: options.responseFormat || { type: "json_object" },
      temperature: options.temperature || 0.7
    });

    return {
      content: response.choices[0].message.content || '',
      provider: 'openai',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.000015
    };
  }

  private async callDeepseek(client: OpenAI, messages: any[], options: any): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: options.model || 'deepseek-chat',
      messages: messages,
      response_format: options.responseFormat || { type: "json_object" },
      temperature: options.temperature || 0.7
    });

    return {
      content: response.choices[0].message.content || '',
      provider: 'deepseek',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.00000014
    };
  }

  private async callGemini(client: any, messages: any[], options: any): Promise<AIResponse> {
    // Convert messages to Gemini format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const response = await client.models.generateContent({
      model: options.model || 'gemini-2.5-flash',
      contents: `${prompt}\n\nPlease provide your complete response in JSON format.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return {
      content: response.text || '',
      provider: 'gemini',
      tokensUsed: 0, // Gemini doesn't provide token count
      cost: 0
    };
  }

  private async callAnthropic(client: any, messages: any[], options: any): Promise<AIResponse> {
    const response = await client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: messages,
      temperature: options.temperature || 0.7
    });

    return {
      content: response.content[0].text || '',
      provider: 'anthropic',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.000015
    };
  }

  private async callXAI(client: OpenAI, messages: any[], options: any): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: options.model || 'grok-2-1212',
      messages: messages,
      response_format: options.responseFormat || { type: "json_object" },
      temperature: options.temperature || 0.7
    });

    return {
      content: response.choices[0].message.content || '',
      provider: 'xai',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.000002
    };
  }
}

// Export singleton instance
export const multiProviderAI = new MultiProviderAI();
export default multiProviderAI;