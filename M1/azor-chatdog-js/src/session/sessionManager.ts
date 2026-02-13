/**
 * SessionManager - Orchestrates session lifecycle and manages active session
 */

import type { Assistant } from '../assistant/assistant.js';
import { ChatSession } from './chatSession.js';
import type {
  SessionSwitchResult,
  SessionCreateResult,
  SessionRemoveResult,
} from '../types/index.js';
import { removeSessionFile } from '../files/sessionFiles.js';
import type { McpClient } from '../mcp/client.js';
import { AssistantRegistry } from '../assistant/registry.js';

/**
 * SessionManager singleton class
 */
export class SessionManager {
  private currentSession?: ChatSession;
  private mcpClient: McpClient | null = null;

  /**
   * Set the MCP Client for tool calling
   */
  setMcpClient(client: McpClient): void {
    this.mcpClient = client;
    
    // Also set it on the current session if one exists
    if (this.currentSession) {
      this.currentSession.setMcpClient(client);
    }
  }

  /**
   * Get the current active session
   */
  getCurrentSession(): ChatSession {
    if (!this.currentSession) {
      throw new Error('No active session. Call createNewSession() first.');
    }
    return this.currentSession;
  }

  /**
   * Check if there is an active session
   */
  hasActiveSession(): boolean {
    return !!this.currentSession;
  }

  /**
   * Create a new session
   */
  createNewSession(saveCurrent: boolean = true): SessionCreateResult {
    let saveAttempted = false;
    let previousId: string | undefined;
    let saveError: string | undefined;

    // Save current session if requested
    if (saveCurrent && this.currentSession) {
      saveAttempted = true;
      previousId = this.currentSession.id;

      const result = this.currentSession.saveToFile();
      if (!result.success) {
        saveError = result.error;
      }
    }

    // Create new session with MCP client if available
    const newSession = new ChatSession(this.getRegisteredAssistant(), undefined, undefined, this.mcpClient || undefined);
    this.currentSession = newSession;

    return {
      session: newSession,
      saveAttempted,
      previousId,
      saveError,
    };
  }

  /**
   * Switch assistant - deleguje do aktualnej sesji
   */
  switchAssistant(assistantId: string): void {
    if (!this.currentSession) throw new Error('No active session. Call createNewSession() first.');
    this.currentSession.switchAssistant(this.getRegisteredAssistant(assistantId));
  }

  /**
   * Switch to an existing session
   */
  switchToSession(sessionId: string): SessionSwitchResult {
    let saveAttempted = false;
    let previousId: string | undefined;

    // Save current session first
    if (this.currentSession) {
      saveAttempted = true;
      previousId = this.currentSession.id;

      const saveResult = this.currentSession.saveToFile();
      if (!saveResult.success) {
        console.error('Error saving current session:', saveResult.error);
      }
    }

    // Load new session with MCP client if available
    const loadResult = ChatSession.loadFromFile(sessionId, this.mcpClient || undefined);

    if (!loadResult.success) {
      return {
        session: this.currentSession!,
        saveAttempted,
        previousId,
        loadSuccessful: false,
        error: loadResult.error,
        hasHistory: false,
      };
    }

    const newSession = loadResult.value;
    this.currentSession = newSession;

    return {
      session: newSession,
      saveAttempted,
      previousId,
      loadSuccessful: true,
      hasHistory: !newSession.isEmpty(),
    };
  }

  /**
   * Remove current session and create new one
   */
  removeCurrentSessionAndCreateNew(): SessionRemoveResult {
    if (!this.currentSession) {
      throw new Error('No active session to remove');
    }

    const removedId = this.currentSession.id;
    const removeResult = removeSessionFile(removedId);

    // Create new session with MCP client if available
    const newSession = new ChatSession(this.getRegisteredAssistant(), undefined, undefined, this.mcpClient || undefined);
    this.currentSession = newSession;

    return {
      session: newSession,
      removedId,
      success: removeResult.success,
      error: removeResult.success ? undefined : removeResult.error,
    };
  }

  /**
   * Initialize from CLI arguments
   */
  initializeFromCLI(cliSessionId?: string): ChatSession {
    if (cliSessionId) {
      // Try to load specified session with MCP client if available
      const result = ChatSession.loadFromFile(cliSessionId, this.mcpClient || undefined);

      if (result.success) {
        this.currentSession = result.value;
        return result.value;
      } else {
        console.error(`Error loading session ${cliSessionId}:`, result.error);
        console.log('Creating new session instead...');
      }
    }

    // Create new session with MCP client if available
    const session = new ChatSession(this.getRegisteredAssistant(), undefined, undefined, this.mcpClient || undefined);
    this.currentSession = session;
    return session;
  }

  /**
   * Cleanup and save on exit
   */
  cleanupAndSave(): void {
    if (this.currentSession) {
      const result = this.currentSession.saveToFile();
      if (!result.success) {
        console.error('Error saving session on exit:', result.error);
      }
    }
  }

  private getRegisteredAssistant(assistantId?: string): Assistant {
    const assistantIdToUse = assistantId || this.currentSession?.assistantId || 'azor';
    const registeredAssistant = AssistantRegistry.get(assistantIdToUse);
    if (!registeredAssistant) throw new Error(`Assistant not found: ${assistantIdToUse}`);
    return registeredAssistant;
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | undefined;

/**
 * Get the session manager singleton
 */
export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}
