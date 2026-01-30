/**
 * MCP Server dla AZØRA - udostępnia narzędzia do zarządzania sesjami czatu.
 * 
 * Uruchomienie:
 *   pnpm run mcp
 * 
 * Testowanie:
 *   npx @modelcontextprotocol/inspector pnpm run mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listSessions, loadSessionHistory, removeSessionFile } from '../files/sessionFiles.js';

// Inicjalizacja serwera MCP
const server = new McpServer({
  name: 'azor-session-manager',
  version: '1.0.0',
});

// ... definicje narzędzi (patrz szczegóły w pliku planu)

// Uruchomienie serwera
const transport = new StdioServerTransport();
await server.connect(transport);