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
    { name: 'openai', priority: 3, available: true, costPerToken: 0.000015 }, // Most expensive
    { name: 'anthropic', priority: 4, available: true, costPerToken: 0.000015 }
  ];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
    }

    // Initialize Google Gemini
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
    }

    // Initialize Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
    }

    // Initialize Deepseek (using OpenAI-compatible API)
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1'
      }));
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
        const response = await this.callProvider(providerName, prompt, options);
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

  private async callProvider(providerName: string, prompt: string, options: any): Promise<AIResponse> {
    const provider = this.providers.get(providerName);
    
    switch (providerName) {
      case 'openai':
        return this.callOpenAI(provider, prompt, options);
      
      case 'gemini':
        return this.callGemini(provider, prompt, options);
      
      case 'deepseek':
        return this.callDeepseek(provider, prompt, options);
      
      case 'anthropic':
        return this.callAnthropic(provider, prompt, options);
      
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  private async callOpenAI(client: OpenAI, prompt: string, options: any): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease provide your complete response in JSON format with the detailed CAT exam structure.`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7
    });

    return {
      content: response.choices[0].message.content || '',
      provider: 'openai',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.000015
    };
  }

  private async callGemini(client: any, prompt: string, options: any): Promise<AIResponse> {
    const model = client.models.generateContent({
      model: options.model || 'gemini-2.5-flash',
      contents: `${prompt}\n\nPlease provide your complete response in JSON format with the detailed CAT exam structure.`,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7
      }
    });

    const response = await model;
    
    return {
      content: response.text || '',
      provider: 'gemini',
      tokensUsed: response.usageMetadata?.totalTokenCount,
      cost: (response.usageMetadata?.totalTokenCount || 0) * 0.00000075
    };
  }

  private async callDeepseek(client: OpenAI, prompt: string, options: any): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: options.model || 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease provide your complete response in JSON format with the detailed CAT exam structure.`
        }
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      response_format: { type: 'json_object' }
    });

    return {
      content: response.choices[0].message.content || '',
      provider: 'deepseek',
      tokensUsed: response.usage?.total_tokens,
      cost: (response.usage?.total_tokens || 0) * 0.00000014
    };
  }

  private async callAnthropic(client: Anthropic, prompt: string, options: any): Promise<AIResponse> {
    const response = await client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease provide your complete response in JSON format with the detailed CAT exam structure.`
        }
      ]
    });

    const content = response.content[0];
    const textContent = 'text' in content ? content.text : '';

    return {
      content: textContent,
      provider: 'anthropic',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      cost: (response.usage.input_tokens + response.usage.output_tokens) * 0.000015
    };
  }

  getProviderStatus(): { provider: string; available: boolean; priority: number; costPerToken: number }[] {
    return this.providerConfigs.map(config => ({
      provider: config.name,
      available: this.providers.has(config.name),
      priority: config.priority,
      costPerToken: config.costPerToken
    }));
  }

  async testProvider(providerId: string, providerConfig: any): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Initialize provider for testing
      let testClient;
      
      switch (providerId) {
        case 'openai':
          testClient = new OpenAI({ apiKey: providerConfig.apiKey });
          break;
        case 'gemini':
          testClient = new GoogleGenAI({ apiKey: providerConfig.apiKey });
          break;
        case 'deepseek':
          testClient = new OpenAI({
            apiKey: providerConfig.apiKey,
            baseURL: 'https://api.deepseek.com/v1'
          });
          break;
        case 'anthropic':
          testClient = new Anthropic({ apiKey: providerConfig.apiKey });
          break;
        case 'groq':
          testClient = new OpenAI({
            apiKey: providerConfig.apiKey,
            baseURL: 'https://api.groq.com/openai/v1'
          });
          break;
        default:
          return { success: false, message: 'Unknown provider', error: 'Provider not supported' };
      }

      // Test with a simple request
      const testPrompt = "Say 'Test successful' if you can read this message.";
      
      if (providerId === 'gemini') {
        const response = await testClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: testPrompt,
        });
        const result = response.text || '';
        return { success: true, message: `Test successful. Response: ${result.substring(0, 50)}...` };
      } else if (providerId === 'anthropic') {
        const response = await testClient.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 50,
          messages: [{ role: 'user', content: testPrompt }]
        });
        const content = response.content[0];
        const result = 'text' in content ? content.text : '';
        return { success: true, message: `Test successful. Response: ${result.substring(0, 50)}...` };
      } else {
        // OpenAI-compatible APIs (OpenAI, Deepseek, Groq)
        const response = await testClient.chat.completions.create({
          model: providerId === 'openai' ? 'gpt-4o' : 
                 providerId === 'deepseek' ? 'deepseek-chat' : 
                 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 50
        });
        const result = response.choices[0].message.content || '';
        return { success: true, message: `Test successful. Response: ${result.substring(0, 50)}...` };
      }
    } catch (error: any) {
      console.error(`Provider ${providerId} test failed:`, error);
      return { 
        success: false, 
        message: 'Test failed', 
        error: error.message || error.toString() 
      };
    }
  }
}

export const multiProviderAI = new MultiProviderAI();