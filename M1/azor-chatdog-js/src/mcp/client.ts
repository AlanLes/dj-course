// Główne elementy:
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Anthropic } from '@anthropic-ai/sdk';
import type { MCPTool } from '../types/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Client wrapper for connecting to the AZOR MCP Server
 */
export class McpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private tools: MCPTool[] = [];
  private connected = false;

  constructor() {
    this.client = new Client({
      name: 'azor-mcp-client',
      version: '1.0.0',
    });
  }

  /**
   * Connect to the MCP Server by spawning it as a subprocess
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Get the project root (two levels up from src/mcp/)
    const projectRoot = path.resolve(__dirname, '../..');

    // Spawn the MCP server using tsx for TypeScript execution
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'src/mcp/server.ts'],
      cwd: projectRoot,
      stderr: 'pipe', // Capture stderr to avoid noise in console
    });

    await this.client.connect(this.transport);
    this.connected = true;

    // Fetch available tools
    await this.refreshTools();
  }

  /**
   * Disconnect from the MCP Server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.connected = false;
    this.transport = null;
    this.tools = [];
  }

  /**
   * Refresh the list of available tools from the server
   */
  async refreshTools(): Promise<void> {
    if (!this.connected) {
      throw new Error('MCP Client not connected');
    }

    const result = await this.client.listTools();
    this.tools = result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));
  }

  /**
   * Get the list of available MCP tools
   */
  listTools(): MCPTool[] {
    return [...this.tools];
  }

  /**
   * Call a tool on the MCP Server
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    if (!this.connected) {
      throw new Error('MCP Client not connected');
    }

    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    // Extract text content from the result
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find(
        (c): c is { type: 'text'; text: string } => c.type === 'text'
      );
      if (textContent) {
        return textContent.text;
      }
    }

    // Fallback to structured content if available
    if (result.structuredContent) {
      return JSON.stringify(result.structuredContent, null, 2);
    }

    return JSON.stringify(result);
  }

  /**
   * Convert MCP tools to Anthropic tool format
   */
  getAnthropicTools(): Anthropic.Tool[] {
    return this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: {
        type: 'object' as const,
        properties: (tool.inputSchema.properties as Record<string, object>) || {},
        required: (tool.inputSchema.required as string[]) || [],
      },
    }));
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if there are any tools available
   */
  hasTools(): boolean {
    return this.tools.length > 0;
  }
}

/**
 * Singleton instance of MCP Client
 */
let mcpClientInstance: McpClient | null = null;

/**
 * Get the singleton MCP Client instance
 */
export function getMcpClient(): McpClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new McpClient();
  }
  return mcpClientInstance;
}

/**
 * Initialize and connect the MCP Client
 */
export async function initMcpClient(): Promise<McpClient> {
  const client = getMcpClient();
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}

/**
 * Cleanup the MCP Client
 */
export async function cleanupMcpClient(): Promise<void> {
  if (mcpClientInstance && mcpClientInstance.isConnected()) {
    await mcpClientInstance.disconnect();
  }
  mcpClientInstance = null;
}
