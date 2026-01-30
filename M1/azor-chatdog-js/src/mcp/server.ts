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
import fs from 'fs';
import { listSessions, removeSessionFile } from '../files/sessionFiles.js';
import { getSessionFilePath } from '../files/config.js';
import type { SessionHistoryFile } from '../types/index.js';

// Inicjalizacja serwera MCP
const server = new McpServer({
  name: 'azor-session-manager',
  version: '1.0.0',
});

// ============================================================
// Funkcja pomocnicza - pobiera pełne dane sesji z pliku
// ============================================================

function loadFullSessionData(sessionId: string): SessionHistoryFile | null {
  const filePath = getSessionFilePath(sessionId);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as SessionHistoryFile;
  } catch {
    return null;
  }
}

// ============================================================
// TOOL 1: list_sessions - Listowanie sesji
// ============================================================

server.registerTool(
  'list_sessions',
  {
    title: 'List Sessions',
    description:
      'Listuje wszystkie sesje/wątki czatu AZØRA wraz z metadanymi: ID sesji, model, liczba wiadomości, data ostatniej modyfikacji, pierwszy fragment wiadomości.',
    inputSchema: {},
  },
  async () => {
    const sessions = listSessions();

    if (sessions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'empty',
                message: 'Brak zapisanych sesji w ~/.azor/',
                sessions: [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Konwertuj Date na ISO string dla JSON
    const sessionsForJson = sessions.map((s) => ({
      session_id: s.session_id,
      model: s.model,
      message_count: s.message_count,
      last_modified: s.last_modified.toISOString(),
      first_message_preview: s.first_message?.substring(0, 100),
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'success',
              count: sessions.length,
              sessions: sessionsForJson,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 2: get_session - Pobieranie zawartości sesji
// ============================================================

server.registerTool(
  'get_session',
  {
    title: 'Get Session',
    description:
      'Zwraca pełne metadane i zawartość wybranej sesji czatu AZØRA (historię konwersacji).',
    inputSchema: {
      session_id: z.string().describe('Identyfikator sesji do pobrania (UUID)'),
    },
  },
  async ({ session_id }) => {
    const data = loadFullSessionData(session_id);

    if (data === null) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'error',
                message: `Sesja o ID '${session_id}' nie istnieje lub nie można jej odczytać.`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Pobierz datę modyfikacji pliku
    const filePath = getSessionFilePath(session_id);
    let fileModified: string | null = null;
    try {
      const stats = fs.statSync(filePath);
      fileModified = stats.mtime.toISOString();
    } catch {
      // Ignoruj błąd
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'success',
              session_id: data.session_id,
              model: data.model,
              system_role: data.system_role,
              messages_count: data.history.length,
              file_modified: fileModified,
              history: data.history,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 3: delete_sessions - Usuwanie sesji
// ============================================================

server.registerTool(
  'delete_sessions',
  {
    title: 'Delete Sessions',
    description:
      'Usuwa wybrane sesje/wątki czatu AZØRA. Przyjmuje listę ID sesji do usunięcia.',
    inputSchema: {
      session_ids: z
        .array(z.string())
        .describe('Lista identyfikatorów sesji do usunięcia'),
    },
  },
  async ({ session_ids }) => {
    if (session_ids.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'error',
                message: 'Nie podano żadnych ID sesji do usunięcia.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const deleted: string[] = [];
    const failed: Array<{ session_id: string; reason: string }> = [];

    for (const sessionId of session_ids) {
      const result = removeSessionFile(sessionId);

      if (result.success) {
        deleted.push(sessionId);
      } else {
        failed.push({
          session_id: sessionId,
          reason: result.error,
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: deleted.length > 0 ? 'success' : 'error',
              deleted_count: deleted.length,
              failed_count: failed.length,
              deleted,
              failed,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================================
// Uruchomienie serwera
// ============================================================

const transport = new StdioServerTransport();
await server.connect(transport);