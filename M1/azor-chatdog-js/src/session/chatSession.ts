/**
 * ChatSession - Manages a single chat session
 */

import { v4 as uuidv4 } from 'uuid';
import type { Assistant } from '../assistant/assistant.js';
import type {
  ILLMClient,
  ILLMChatSession,
  ILLMChatSessionWithTools,
  Message,
  LLMResponse,
  TokenInfo,
  Result,
  MCPTool,
} from '../types/index.js';
import {
  ASK_USER_CLARIFICATION_TOOL,
  CLARIFICATION_TOOL_NAME,
  handleClarificationToolCall,
} from '../tools/index.js';
import { loadSessionHistory, saveSessionHistory } from '../files/sessionFiles.js';
import { appendToWAL } from '../files/wal.js';
import { MAX_CONTEXT_TOKENS } from '../files/config.js';
import { GeminiLLMClient } from '../llm/geminiClient.js';
import { AnthropicLLMClient } from '../llm/anthropicClient.js';
import { LlamaClient } from '../llm/llamaClient.js';
import type { McpClient } from '../mcp/client.js';
import { AssistantRegistry } from '../assistant/registry.js';

/**
 * Engine mapping for LLM client selection
 */
const ENGINE_MAPPING: Record<string, typeof GeminiLLMClient | typeof AnthropicLLMClient | typeof LlamaClient> = {
  LLAMA_CPP: LlamaClient,
  GEMINI: GeminiLLMClient,
  ANTHROPIC: AnthropicLLMClient,
};

/**
 * Get the selected LLM client based on ENGINE environment variable
 */
export function getSelectedLLMClient(): ILLMClient {
  const engine = (process.env.ENGINE || 'GEMINI').toUpperCase();
  const SelectedClientClass = ENGINE_MAPPING[engine] || GeminiLLMClient;
  return SelectedClientClass.fromEnvironment();
}

/**
 * Check if a session supports tool calling
 */
function supportsTools(session: ILLMChatSession): session is ILLMChatSessionWithTools {
  return 'sendMessageWithTools' in session && typeof (session as ILLMChatSessionWithTools).sendMessageWithTools === 'function';
}

/**
 * ChatSession class - represents and manages a single chat session
 */
export class ChatSession {
  private sessionId: string;
  private history: Message[] = [];
  private llmClient: ILLMClient;
  private llmChatSession: ILLMChatSession;
  private assistant: Assistant;
  private mcpClient: McpClient | null = null;

  constructor(assistant: Assistant, sessionId?: string, history?: Message[], mcpClient?: McpClient) {
    this.sessionId = sessionId || uuidv4();
    this.assistant = assistant;
    this.history = history || [];
    this.mcpClient = mcpClient || null;

    // Initialize LLM client
    this.llmClient = getSelectedLLMClient();

    // Create chat session
    this.llmChatSession = this.llmClient.createChatSession(
      assistant.systemPrompt,
      this.history
    );
  }

  /**
   * Set the MCP Client for tool calling
   */
  setMcpClient(client: McpClient): void {
    this.mcpClient = client;
  }

  /**
   * Load session from file
   */
  static loadFromFile(
    sessionId: string,
    mcpClient?: McpClient
  ): Result<ChatSession, string> {
    const result = loadSessionHistory(sessionId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const { history, assistantId } = result.value;
    const registeredAssistant = AssistantRegistry.get(assistantId);
    if (!registeredAssistant) {
      return { success: false, error: `Assistant not found: ${assistantId}` };
    }
    const session = new ChatSession(registeredAssistant, sessionId, history, mcpClient);

    return { success: true, value: session };
  }

  /**
   * Save session to file
   */
  saveToFile(): Result<boolean, string> {
    return saveSessionHistory(
      this.sessionId,
      this.history,
      this.assistant.systemPrompt,
      this.llmClient.getModelName(),
      this.assistant.id
    );
  }

  /**
   * Send a message and get response
   * If MCP Client is available and LLM supports tools, uses tool calling
   */
  async sendMessage(text: string): Promise<LLMResponse> {
    let response: LLMResponse;

    const doesLLMSupportTools = supportsTools(this.llmChatSession);

    if (doesLLMSupportTools) {

      const allTools: MCPTool[] = [ASK_USER_CLARIFICATION_TOOL];
      
      // Check if we can use tools
      const hasMcpTools = 
        this.mcpClient && 
        this.mcpClient.isConnected() && 
        this.mcpClient.hasTools();
  
      if (hasMcpTools) {
        allTools.push(...this.mcpClient!.listTools());
      }

      const onToolCall = async(toolName: string, toolInput: Record<string, unknown>): Promise<string> => {
        if (toolName === CLARIFICATION_TOOL_NAME) return await handleClarificationToolCall(toolInput);
        return hasMcpTools ? await this.mcpClient!.callTool(toolName, toolInput) : `Nieznane narzędzie: ${toolName}`;
      }

      response = await (
        this.llmChatSession as ILLMChatSessionWithTools
      ).sendMessageWithTools(text, allTools, onToolCall);
    } else {
      // LLM nie wspiera tools — zwykłe wysłanie
      response = await this.llmChatSession.sendMessage(text);
    }

    // Sync history from LLM session (it updates internally)
    this.history = this.llmChatSession.getHistory();

    // Log to WAL
    const totalTokens = this.countTokens();
    appendToWAL(
      this.sessionId,
      text,
      response.text,
      totalTokens,
      this.llmClient.getModelName()
    );

    return response;
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return this.history;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    // Recreate chat session with empty history
    this.llmChatSession = this.llmClient.createChatSession(
      this.assistant.systemPrompt,
      []
    );
  }

  /**
   * Remove last user-assistant exchange
   */
  popLastExchange(): boolean {
    if (this.history.length < 2) {
      return false;
    }

    // Remove last two messages (user + assistant)
    this.history.splice(this.history.length - 2, 2);

    // Recreate chat session with updated history
    this.llmChatSession = this.llmClient.createChatSession(
      this.assistant.systemPrompt,
      this.history
    );

    return true;
  }

  /**
   * Count total tokens in history
   */
  countTokens(): number {
    return this.llmClient.countHistoryTokens(this.history);
  }

  /**
   * Check if session is empty
   */
  isEmpty(): boolean {
    return this.history.length === 0;
  }

  /**
   * Get remaining tokens in context
   */
  getRemainingTokens(): number {
    const used = this.countTokens();
    return MAX_CONTEXT_TOKENS - used;
  }

  /**
   * Get token information
   */
  getTokenInfo(): TokenInfo {
    const total = this.countTokens();
    const remaining = this.getRemainingTokens();
    return {
      total,
      remaining,
      max: MAX_CONTEXT_TOKENS,
    };
  }

  /**
   * Switch assistant
   */
  switchAssistant(newAssistant: Assistant): void {
    this.history.push({
      role: 'user',
      parts: [{ text: `[SYSTEM: Zmiana asystenta z ${this.assistant.name} na ${newAssistant.name}. Od teraz odpowiadasz jako nowy asystent.]` }]
    });
    this.assistant = newAssistant;
    this.llmChatSession = this.llmClient.createChatSession(
      newAssistant.systemPrompt,
      this.history
    );
  }

  /**
   * Get assistant name
   */
  get assistantName(): string {
    return this.assistant.name;
  }

  /**
   * Get assistant ID
   */
  get assistantId(): string {
    return this.assistant.id;
  }

  /**
   * Get session ID
   */
  get id(): string {
    return this.sessionId;
  }

  /**
   * Get model name
   */
  get modelName(): string {
    return this.llmClient.getModelName();
  }
}
