import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { LlmProvider } from "@shared/schema";

// OpenAI Configuration
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

// Anthropic Configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Google Gemini Configuration
const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

// XAI Configuration (using OpenAI-compatible API)
const xai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || "" 
});

interface AIRequest {
  provider: string;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class MultiProviderAI {
  private providers: Map<string, any> = new Map();

  constructor() {
    this.providers.set('openai', openai);
    this.providers.set('anthropic', anthropic);
    this.providers.set('google', gemini);
    this.providers.set('xai', xai);
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const { provider, model, messages, temperature = 0.7, maxTokens = 2000, responseFormat } = request;

    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          return await this.generateOpenAI(model, messages, temperature, maxTokens, responseFormat);
        
        case 'anthropic':
          return await this.generateAnthropic(model, messages, temperature, maxTokens);
        
        case 'google':
          return await this.generateGemini(model, messages, temperature, maxTokens, responseFormat);
        
        case 'xai':
          return await this.generateXAI(model, messages, temperature, maxTokens, responseFormat);
        
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with ${provider} provider:`, error);
      throw new Error(`AI generation failed with ${provider}: ${error.message}`);
    }
  }

  private async generateOpenAI(
    model: string, 
    messages: any[], 
    temperature: number, 
    maxTokens: number,
    responseFormat?: { type: "json_object" | "text" }
  ): Promise<AIResponse> {
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
    });

    return {
      content: response.choices[0].message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      }
    };
  }

  private async generateAnthropic(
    model: string, 
    messages: any[], 
    temperature: number, 
    maxTokens: number
  ): Promise<AIResponse> {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system')?.content || "";
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await anthropic.messages.create({
      model: model || "claude-sonnet-4-20250514",
      system: systemMessage,
      messages: conversationMessages,
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : "";

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      }
    };
  }

  private async generateGemini(
    model: string, 
    messages: any[], 
    temperature: number, 
    maxTokens: number,
    responseFormat?: { type: "json_object" | "text" }
  ): Promise<AIResponse> {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system')?.content || "";
    const userMessage = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');

    const config: any = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (systemMessage) {
      config.systemInstruction = systemMessage;
    }

    if (responseFormat?.type === "json_object") {
      config.responseMimeType = "application/json";
    }

    const response = await gemini.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: userMessage,
      config,
    });

    return {
      content: response.text || "",
      usage: {
        promptTokens: 0, // Gemini doesn't provide detailed usage
        completionTokens: 0,
        totalTokens: 0,
      }
    };
  }

  private async generateXAI(
    model: string, 
    messages: any[], 
    temperature: number, 
    maxTokens: number,
    responseFormat?: { type: "json_object" | "text" }
  ): Promise<AIResponse> {
    const response = await xai.chat.completions.create({
      model: model || "grok-2-1212",
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
    });

    return {
      content: response.choices[0].message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      }
    };
  }

  getAvailableModels(provider: string): string[] {
    switch (provider.toLowerCase()) {
      case 'openai':
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
      
      case 'anthropic':
        return ["claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"];
      
      case 'google':
        return ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
      
      case 'xai':
        return ["grok-2-1212", "grok-2-vision-1212", "grok-beta", "grok-vision-beta"];
      
      default:
        return [];
    }
  }

  async testProviderConnection(provider: string, apiKey?: string): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        provider,
        model: this.getAvailableModels(provider)[0],
        messages: [
          { role: 'user', content: 'Test connection - respond with "OK"' }
        ],
        temperature: 0,
        maxTokens: 10,
      };

      // Temporarily override API key if provided
      if (apiKey) {
        const originalKey = this.getProviderApiKey(provider);
        this.setProviderApiKey(provider, apiKey);
        
        try {
          await this.generateCompletion(testRequest);
          return true;
        } finally {
          this.setProviderApiKey(provider, originalKey);
        }
      } else {
        await this.generateCompletion(testRequest);
        return true;
      }
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }

  private getProviderApiKey(provider: string): string {
    switch (provider.toLowerCase()) {
      case 'openai': return process.env.OPENAI_API_KEY || "";
      case 'anthropic': return process.env.ANTHROPIC_API_KEY || "";
      case 'google': return process.env.GEMINI_API_KEY || "";
      case 'xai': return process.env.XAI_API_KEY || "";
      default: return "";
    }
  }

  private setProviderApiKey(provider: string, apiKey: string): void {
    switch (provider.toLowerCase()) {
      case 'openai':
        this.providers.set('openai', new OpenAI({ apiKey }));
        break;
      case 'anthropic':
        this.providers.set('anthropic', new Anthropic({ apiKey }));
        break;
      case 'google':
        this.providers.set('google', new GoogleGenAI({ apiKey }));
        break;
      case 'xai':
        this.providers.set('xai', new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey }));
        break;
    }
  }
}

export const multiProviderAI = new MultiProviderAI();