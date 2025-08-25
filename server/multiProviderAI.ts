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
  private currentProvider: string | null = null;
  private providerConfigs: AIProvider[] = [
    { name: 'deepseek', priority: 1, available: true, costPerToken: 0.00000014 }, // Highest priority - cheapest
    { name: 'groq', priority: 2, available: true, costPerToken: 0.00000027 }, // Fast inference
    { name: 'meta', priority: 3, available: true, costPerToken: 0.00000040 }, // Llama models
    { name: 'gemini', priority: 4, available: true, costPerToken: 0.00000075 }, // Mid-range
    { name: 'xai', priority: 5, available: true, costPerToken: 0.000002 }, // xAI Grok
    { name: 'openai', priority: 6, available: true, costPerToken: 0.000015 }, // Most expensive
    { name: 'anthropic', priority: 7, available: true, costPerToken: 0.000015 }
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
    console.log('🔍 Initializing AI providers from super admin settings...');
    
    try {
      // First try to get configuration from database (super admin settings)
      const { DatabaseStorage } = await import('./storage-simple');
      const storage = new DatabaseStorage();
      
      const dbProviders = await storage.getAllLLMProviders();
      console.log('🔍 Available providers from super admin settings:', dbProviders.map(p => ({ 
        id: p.id, 
        priority: p.priority || 999,
        hasApiKey: !!p.apiKey, 
        keyLength: p.apiKey ? p.apiKey.length : 0,
        isEnabled: p.isEnabled 
      })));

      // Sort providers by priority (lower number = higher priority)
      const sortedProviders = dbProviders
        .filter(p => p.isEnabled !== false)
        .sort((a, b) => (a.priority || 999) - (b.priority || 999));

      let providersFromDB = 0;
      
      for (const provider of sortedProviders) {
        // Prioritize environment variables over database keys
        const envKey = this.getEnvironmentKey(provider.id);
        const apiKey = envKey || provider.apiKey;
        
        if (!apiKey) {
          console.log(`⏭️ Skipping ${provider.id}: no API key in environment or DB`);
          continue;
        }
        
        if (envKey && envKey.length > 20) {
          console.log(`🌍 Using environment API key for ${provider.id} (length: ${envKey.length})`);
        } else if (provider.apiKey && provider.apiKey.length > 20) {
          console.log(`💾 Using database API key for ${provider.id} (length: ${provider.apiKey.length})`);
        } else {
          console.log(`⚠️ Skipping ${provider.id}: API key too short (likely invalid)`);
          continue;
        }
        
        console.log(`✅ Initializing ${provider.id} provider (priority: ${provider.priority || 999})`);
        
        try {
          switch (provider.id) {
            case 'openai':
              this.providers.set('openai', new OpenAI({ apiKey }));
              break;
              
            case 'google':
            case 'gemini':
              this.providers.set('gemini', new GoogleGenAI({ apiKey }));
              break;
              
            case 'anthropic':
              this.providers.set('anthropic', new Anthropic({ apiKey }));
              break;
              
            case 'deepseek':
              // DeepSeek uses OpenAI-compatible API
              this.providers.set('deepseek', new OpenAI({ 
                apiKey, 
                baseURL: 'https://api.deepseek.com/v1' 
              }));
              break;
              
            case 'groq':
              // Groq uses OpenAI-compatible API  
              this.providers.set('groq', new OpenAI({ 
                apiKey, 
                baseURL: 'https://api.groq.com/openai/v1' 
              }));
              break;
              
            case 'meta':
              // Meta/Llama via compatible API
              this.providers.set('meta', new OpenAI({ 
                apiKey, 
                baseURL: 'https://api.meta.ai/v1' 
              }));
              break;
              
            case 'xai':
              // xAI Grok uses OpenAI-compatible API
              this.providers.set('xai', new OpenAI({ 
                apiKey, 
                baseURL: 'https://api.x.ai/v1' 
              }));
              break;
              
            default:
              console.log(`⚠️ Unknown provider: ${provider.id}`);
          }
          
          providersFromDB++;
        } catch (providerError) {
          console.error(`Failed to initialize ${provider.id}:`, providerError.message);
        }
      }
      
      // Update provider configs with database priorities
      this.updateProviderConfigsFromDB(dbProviders);
      
      console.log(`🎯 Total providers initialized from super admin settings: ${providersFromDB}`);
      
      // Fallback to environment variables if no database providers
      if (providersFromDB === 0) {
        console.log('🔄 No database providers found, falling back to environment variables...');
        await this.initializeFromEnvironment();
      }
      
    } catch (error) {
      console.error('Error initializing providers from database:', error);
      await this.initializeFromEnvironment();
    }
  }

  private getEnvironmentKey(providerId: string): string | undefined {
    switch (providerId) {
      case 'openai': return process.env.OPENAI_API_KEY;
      case 'google':
      case 'gemini': return process.env.GOOGLE_API_KEY;
      case 'anthropic': return process.env.ANTHROPIC_API_KEY;
      case 'deepseek': return process.env.DEEPSEEK_API_KEY;
      case 'groq': return process.env.GROQ_API_KEY;
      case 'meta': return process.env.META_API_KEY;
      case 'xai': return process.env.XAI_API_KEY;
      default: return undefined;
    }
  }

  private updateProviderConfigsFromDB(dbProviders: any[]) {
    // Update the priority order based on database configuration
    this.providerConfigs = dbProviders
      .filter(p => p.isEnabled !== false)
      .map(p => ({
        name: p.id,
        priority: p.priority || 999,
        available: true,
        costPerToken: this.getCostPerToken(p.id)
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  private getCostPerToken(providerId: string): number {
    const costs: Record<string, number> = {
      'deepseek': 0.00000014,
      'groq': 0.00000027,
      'meta': 0.00000040,
      'gemini': 0.00000075,
      'xai': 0.000002,
      'openai': 0.000015,
      'anthropic': 0.000015
    };
    return costs[providerId] || 0.000015;
  }

  private async initializeFromEnvironment() {
    console.log('🔄 Initializing from environment variables...');
    
    // Initialize providers based on available environment variables
    const envProviders = [
      { id: 'deepseek', key: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' },
      { id: 'groq', key: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' },
      { id: 'meta', key: process.env.META_API_KEY, baseURL: 'https://api.meta.ai/v1' },
      { id: 'openai', key: process.env.OPENAI_API_KEY },
      { id: 'gemini', key: process.env.GOOGLE_API_KEY },
      { id: 'anthropic', key: process.env.ANTHROPIC_API_KEY }
    ];

    for (const provider of envProviders) {
      if (!provider.key) {
        console.log(`⏭️ Skipping ${provider.id}: no environment key`);
        continue;
      }

      console.log(`✅ Initializing ${provider.id} provider from environment`);
      
      switch (provider.id) {
        case 'openai':
        case 'deepseek':
        case 'groq':
        case 'meta':
          this.providers.set(provider.id, new OpenAI({ 
            apiKey: provider.key, 
            ...(provider.baseURL && { baseURL: provider.baseURL })
          }));
          break;
          
        case 'gemini':
          this.providers.set('gemini', new GoogleGenAI({ apiKey: provider.key }));
          break;
          
        case 'anthropic':
          this.providers.set('anthropic', new Anthropic({ apiKey: provider.key }));
          break;
      }
    }
    
    console.log(`🎯 Total providers initialized from environment: ${this.providers.size}`);
  }

  private async initializeDatabaseProviders() {
    // Get API keys from database storage (fallback method)
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

  async generateContent(params: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: { type: string };
    taskType?: string;
  }): Promise<AIResponse> {
    
    // Get available providers sorted by priority (cost efficiency)
    const availableProviders = this.providerConfigs
      .filter(config => this.providers.has(config.name))
      .sort((a, b) => a.priority - b.priority);

    console.log(`🎯 Trying AI providers in priority order: ${availableProviders.map(p => p.name).join(' → ')}`);

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // Try each provider in order of priority
    for (const providerConfig of availableProviders) {
      try {
        console.log(`🔄 Attempting ${providerConfig.name} (priority: ${providerConfig.priority})`);
        this.currentProvider = providerConfig.name;
        const provider = this.providers.get(providerConfig.name);
        
        switch (providerConfig.name) {
          case 'deepseek':
            const deepseekResponse = await provider.chat.completions.create({
              model: params.model || 'deepseek-chat',
              messages: params.messages,
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              ...(params.responseFormat && { response_format: params.responseFormat })
            });
            
            console.log(`✅ DeepSeek API successful`);
            return {
              content: deepseekResponse.choices[0]?.message?.content || '',
              provider: 'deepseek',
              tokensUsed: deepseekResponse.usage?.total_tokens,
              cost: (deepseekResponse.usage?.total_tokens || 0) * providerConfig.costPerToken
            };

          case 'groq':
            const groqResponse = await provider.chat.completions.create({
              model: params.model || 'llama3-8b-8192',
              messages: params.messages,
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              ...(params.responseFormat && { response_format: params.responseFormat })
            });
            
            console.log(`✅ Groq API successful`);
            return {
              content: groqResponse.choices[0]?.message?.content || '',
              provider: 'groq',
              tokensUsed: groqResponse.usage?.total_tokens,
              cost: (groqResponse.usage?.total_tokens || 0) * providerConfig.costPerToken
            };

          case 'meta':
            const metaResponse = await provider.chat.completions.create({
              model: params.model || 'llama-3.1-8b-instant',
              messages: params.messages,
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              ...(params.responseFormat && { response_format: params.responseFormat })
            });
            
            console.log(`✅ Meta/Llama API successful`);
            return {
              content: metaResponse.choices[0]?.message?.content || '',
              provider: 'meta',
              tokensUsed: metaResponse.usage?.total_tokens,
              cost: (metaResponse.usage?.total_tokens || 0) * providerConfig.costPerToken
            };

          case 'xai':
            const xaiResponse = await provider.chat.completions.create({
              model: params.model || 'grok-beta',
              messages: params.messages,
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              ...(params.responseFormat && { response_format: params.responseFormat })
            });
            
            console.log(`✅ xAI Grok API successful`);
            return {
              content: xaiResponse.choices[0]?.message?.content || '',
              provider: 'xai',
              tokensUsed: xaiResponse.usage?.total_tokens,
              cost: (xaiResponse.usage?.total_tokens || 0) * providerConfig.costPerToken
            };

          case 'openai':
            const openaiResponse = await provider.chat.completions.create({
              model: params.model || 'gpt-4o',
              messages: params.messages,
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              ...(params.responseFormat && { response_format: params.responseFormat })
            });
            
            console.log(`✅ OpenAI API successful`);
            return {
              content: openaiResponse.choices[0]?.message?.content || '',
              provider: 'openai',
              tokensUsed: openaiResponse.usage?.total_tokens,
              cost: (openaiResponse.usage?.total_tokens || 0) * providerConfig.costPerToken
            };

          case 'anthropic':
            const claudeResponse = await provider.messages.create({
              model: params.model || 'claude-3-5-sonnet-20241022',
              max_tokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.7,
              messages: params.messages.map((msg: any) => ({
                role: msg.role === 'system' ? 'user' : msg.role,
                content: msg.role === 'system' ? `System: ${msg.content}` : msg.content
              }))
            });
            
            console.log(`✅ Anthropic Claude API successful`);
            return {
              content: claudeResponse.content[0]?.text || '',
              provider: 'anthropic',
              tokensUsed: claudeResponse.usage?.input_tokens + claudeResponse.usage?.output_tokens,
              cost: ((claudeResponse.usage?.input_tokens || 0) + (claudeResponse.usage?.output_tokens || 0)) * providerConfig.costPerToken
            };

          case 'gemini':
          case 'google':
            // Handle Google Gemini differently
            const model = provider.getGenerativeModel({ 
              model: params.model || 'gemini-1.5-flash',
              generationConfig: {
                maxOutputTokens: params.maxTokens || 4000,
                temperature: params.temperature || 0.7,
                ...(params.responseFormat && { responseMimeType: "application/json" })
              }
            });
            
            // Combine system and user messages for Gemini
            const combinedContent = params.messages.map(msg => 
              msg.role === 'system' ? `System: ${msg.content}` : msg.content
            ).join('\n\n');
            
            const geminiResponse = await model.generateContent(combinedContent);
            const responseText = geminiResponse.response.text();
            
            console.log(`✅ Google Gemini API successful`);
            return {
              content: responseText,
              provider: providerConfig.name,
              tokensUsed: geminiResponse.response.usageMetadata?.totalTokenCount,
              cost: (geminiResponse.response.usageMetadata?.totalTokenCount || 0) * providerConfig.costPerToken
            };

          default:
            throw new Error(`Unsupported provider: ${providerConfig.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Provider ${providerConfig.name} failed:`, error.message);
        
        // If this is the last provider, re-throw the error
        if (providerConfig === availableProviders[availableProviders.length - 1]) {
          throw error;
        }
        
        // Otherwise, continue to the next provider
        console.log(`🔄 Trying next provider...`);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
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

  getCurrentProvider(): string | null {
    return this.currentProvider;
  }
}

// Export singleton instance
export const multiProviderAI = new MultiProviderAI();
export default multiProviderAI;