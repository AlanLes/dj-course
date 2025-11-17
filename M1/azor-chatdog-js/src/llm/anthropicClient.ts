import { Anthropic } from "@anthropic-ai/sdk";
import { ILLMClient, ILLMChatSession, LLMResponse, Message } from "../types";
import { validateAnthropicConfig } from "./anthropicValidation";

/**
 * Convert universal history format to Anthropic-compatible messages
 * Anthropic expects roles: 'user' or 'assistant'
 */
function convertUniversalHistoryToAnthropic(history: Message[]): Array<{role: 'user' | 'assistant', content: string}> {
  return history.map((msg) => {
    // Convert "model" role to "assistant" for Anthropic
    const role = msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant';

    // Extract text content from parts
    const text = msg.parts.map(part => part.text).join('');

    return {
      role,
      content: text
    };
  });
}

/**
 * Extract plain text from Anthropic Message response
 */
function extractTextFromAnthropicResponse(response: any): string {
  if (!response || !response.content) {
    return '';
  }

  // Extract text from content blocks
  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.text) {
      textParts.push(block.text);
    }
  }

  return textParts.join('\n').trim();
}

export class AnthropicLLMClient implements ILLMClient {
  private client: Anthropic;
  private modelName: string;
  private apiKey: string;
  private maxResponseTokens: number;

  constructor(modelName: string, apiKey: string, maxResponseTokens: number) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.modelName = modelName;
    this.apiKey = apiKey;
    this.maxResponseTokens = maxResponseTokens;
  }

  static fromEnvironment(): AnthropicLLMClient {
    const config = validateAnthropicConfig();
    return new AnthropicLLMClient(config.modelName, config.anthropicApiKey, 4096);
  }

  createChatSession(systemInstruction: string, history?: Message[], thinkingBudget?: number): ILLMChatSession {
    return new AnthropicChatSessionWrapper(this.client, this.modelName, systemInstruction, history || [], thinkingBudget || 0, this.maxResponseTokens);
  }

  countHistoryTokens(history: Message[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    let totalTokens = 0;
    for (const msg of history) {
      for (const part of msg.parts) {
        totalTokens += Math.ceil(part.text.length / 4);
      }
    }
    return totalTokens;
  }

  getModelName(): string {
    return this.modelName;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  preparingForUseMessage(): string {
    return `Preparing Anthropic model ${this.modelName}...`;
  }

  readyForUseMessage(): string {
    const maskedKey = this.apiKey
      ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`
      : 'NOT SET';
    return `Anthropic ${this.modelName} ready (API Key: ${maskedKey})`;
  }
}

export class AnthropicChatSessionWrapper implements ILLMChatSession {
  private client: Anthropic;
  private modelName: string;
  private systemInstruction: string;
  private history: Message[];
  private thinkingBudget: number;
  private maxResponseTokens: number;

  constructor(
    client: Anthropic,
    modelName: string,
    systemInstruction: string,
    history: Message[],
    thinkingBudget: number,
    maxResponseTokens: number
  ) {
    this.client = client;
    this.modelName = modelName;
    this.systemInstruction = systemInstruction;
    this.history = [...history]; // Copy to avoid mutating original
    this.thinkingBudget = thinkingBudget;
    this.maxResponseTokens = maxResponseTokens;
  }

  async sendMessage(text: string): Promise<LLMResponse> {
    // Add user message to history
    this.history.push({
      role: 'user',
      parts: [{ text }],
    });

    // Convert history to Anthropic format
    const anthropicMessages = convertUniversalHistoryToAnthropic(this.history);

    // Build request arguments
    const requestArgs: any = {
      model: this.modelName,
      system: this.systemInstruction,
      messages: anthropicMessages,
      max_tokens: this.maxResponseTokens,
    };

    // Add thinking budget if specified (structured thinking)
    if (this.thinkingBudget > 0) {
      requestArgs.thinking = {
        type: 'structured',
        budget_tokens: this.thinkingBudget,
      };
    }

    // Send message to Anthropic
    const response = await this.client.messages.create(requestArgs);

    // Extract response text
    const responseText = extractTextFromAnthropicResponse(response);

    // Add assistant response to history
    this.history.push({
      role: 'model',
      parts: [{ text: responseText }],
    });

    return { text: responseText };
  }

  getHistory(): Message[] {
    return [...this.history]; // Return copy to prevent external mutation
  }
}