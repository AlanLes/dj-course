import { Anthropic } from "@anthropic-ai/sdk";
import type { 
  ILLMClient, 
  ILLMChatSession, 
  ILLMChatSessionWithTools,
  LLMResponse, 
  Message, 
  MessagePart,
  MCPTool,
  ToolCallHandler 
} from "../types/index.js";
import { AnthropicConfig, validateAnthropicConfig } from "./anthropicValidation.js";

/**
 * Convert universal history format to Anthropic-compatible messages
 * Anthropic expects roles: 'user' or 'assistant'
 */
function convertUniversalHistoryToAnthropic(history: Message[]): Array<{role: 'user' | 'assistant', content: string}> {
  return history.map((msg) => {
    // Convert "model" role to "assistant" for Anthropic
    const role = msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant';

    // Extract text content from parts
    const text = msg.parts.map((part: MessagePart) => part.text).join('');

    return {
      role,
      content: text
    };
  });
}

/**
 * Extract plain text from Anthropic Message response
 */
function extractTextFromAnthropicResponse(response: Anthropic.Message): string {
  if (!response || !response.content) {
    return '';
  }

  // Extract text from content blocks
  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') {
      textParts.push(block.text);
    }
  }

  return textParts.join('\n').trim();
}

/**
 * Convert MCP tools to Anthropic tool format
 */
function convertMcpToolsToAnthropic(tools: MCPTool[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    input_schema: {
      type: 'object' as const,
      properties: (tool.inputSchema.properties as Record<string, object>) || {},
      required: (tool.inputSchema.required as string[]) || [],
    },
  }));
}

export class AnthropicLLMClient implements ILLMClient {
  private client: Anthropic;
  private modelName: string;
  private apiKey: string;
  private maxResponseTokens: number;
  private modelConfig: AnthropicConfig['modelConfig'];

  constructor(modelName: string, apiKey: string, maxResponseTokens: number, modelConfig: AnthropicConfig['modelConfig']) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.modelName = modelName;
    this.apiKey = apiKey;
    this.maxResponseTokens = maxResponseTokens;
    this.modelConfig = modelConfig;
  }

  static fromEnvironment(): AnthropicLLMClient {
    const config = validateAnthropicConfig();
    return new AnthropicLLMClient(config.modelName, config.anthropicApiKey, 4096, config.modelConfig);
  }

  createChatSession(systemInstruction: string, history?: Message[], thinkingBudget?: number): ILLMChatSession {
    return new AnthropicChatSessionWrapper(this.client, this.modelName, systemInstruction, history || [], thinkingBudget || 0, this.maxResponseTokens, this.modelConfig);
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

    /**
 * Generate content directly without chat session
 * Used for role-playing where history is manipulated per-turn
 */
    async generateContent(
      systemInstruction: string,
      history: Message[],
      maxOutputTokens?: number
    ): Promise<LLMResponse> {
      // Convert universal history to Anthropic format (model -> assistant)
      const anthropicMessages = convertUniversalHistoryToAnthropic(history);
    
      // Build request
      const requestArgs: Anthropic.MessageCreateParams = {
        model: this.modelName,
        system: systemInstruction,
        messages: anthropicMessages,
        max_tokens: maxOutputTokens || 256,
        temperature: this.modelConfig.temperature,
      };
    
      // Send message to Anthropic
      const response = await this.client.messages.create(requestArgs);
    
      // Extract response text
      const responseText = extractTextFromAnthropicResponse(response);
    
      return { text: responseText };
    }
}

export class AnthropicChatSessionWrapper implements ILLMChatSessionWithTools {
  private client: Anthropic;
  private modelName: string;
  private systemInstruction: string;
  private history: Message[];
  private thinkingBudget: number;
  private maxResponseTokens: number;
  private modelConfig: AnthropicConfig['modelConfig'];
  
  // Anthropic-native message history for tool calling (preserves tool_use/tool_result blocks)
  private anthropicHistory: Anthropic.MessageParam[] = [];

  constructor(
    client: Anthropic,
    modelName: string,
    systemInstruction: string,
    history: Message[],
    thinkingBudget: number,
    maxResponseTokens: number,
    modelConfig: AnthropicConfig['modelConfig']
  ) {
    this.client = client;
    this.modelName = modelName;
    this.systemInstruction = systemInstruction;
    this.history = [...history]; // Copy to avoid mutating original
    this.thinkingBudget = thinkingBudget;
    this.maxResponseTokens = maxResponseTokens;
    this.modelConfig = modelConfig;
    
    // Initialize Anthropic history from universal history
    this.anthropicHistory = convertUniversalHistoryToAnthropic(this.history);
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
    const requestArgs: Anthropic.MessageCreateParams = {
      model: this.modelName,
      system: this.systemInstruction,
      messages: anthropicMessages,
      max_tokens: this.maxResponseTokens,
      temperature: this.modelConfig.temperature,
    };

    // Add thinking budget if specified (structured thinking)
    if (this.thinkingBudget > 0) {
      requestArgs.thinking = {
        type: 'enabled',
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

  /**
   * Send a message with tool calling support
   * Implements the tool calling loop:
   * 1. Send message with tools
   * 2. If stop_reason is 'tool_use', call the tool and continue
   * 3. Repeat until stop_reason is 'end_turn'
   */
  async sendMessageWithTools(
    text: string,
    tools: MCPTool[],
    onToolCall: ToolCallHandler
  ): Promise<LLMResponse> {
    // Add user message to Anthropic history
    this.anthropicHistory.push({
      role: 'user',
      content: text,
    });

    // Add to universal history as well
    this.history.push({
      role: 'user',
      parts: [{ text }],
    });

    // Convert MCP tools to Anthropic format
    const anthropicTools = convertMcpToolsToAnthropic(tools);

    // Tool calling loop
    let continueLoop = true;
    let finalResponseText = '';

    while (continueLoop) {
      // Build request arguments
      const requestArgs: Anthropic.MessageCreateParams = {
        model: this.modelName,
        system: this.systemInstruction,
        messages: this.anthropicHistory,
        max_tokens: this.maxResponseTokens,
        temperature: this.modelConfig.temperature,
        tools: anthropicTools,
      };

      // Send message to Anthropic
      const response = await this.client.messages.create(requestArgs);

      // Check stop reason
      if (response.stop_reason === 'tool_use') {
        // Add assistant response with tool_use to history
        this.anthropicHistory.push({
          role: 'assistant',
          content: response.content,
        });

        // Process tool calls
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            // Call the tool handler
            const toolResult = await onToolCall(
              block.name,
              block.input as Record<string, unknown>
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResult,
            });
          }
        }

        // Add tool results to history
        this.anthropicHistory.push({
          role: 'user',
          content: toolResults,
        });
      } else {
        // stop_reason is 'end_turn' or similar - we have the final response
        continueLoop = false;
        finalResponseText = extractTextFromAnthropicResponse(response);

        // Add final assistant response to Anthropic history
        this.anthropicHistory.push({
          role: 'assistant',
          content: response.content,
        });

        // Add to universal history
        this.history.push({
          role: 'model',
          parts: [{ text: finalResponseText }],
        });
      }
    }

    return { text: finalResponseText };
  }

  getHistory(): Message[] {
    return [...this.history]; // Return copy to prevent external mutation
  }
}