// Krok 9: Aktualizacja glownej petli czatu
// initChat() - inicjalizacja rejestru zamiast pojedynczego asystenta
// mainLoop() - uzycie dynamicznej nazwy asystenta przy wyswietlaniu odpowiedzi (zamiast hardcoded assistant.name)


/**
 * Main chat loop and initialization
 */

import { config } from 'dotenv';
import { createAzorAssistant } from './assistant/azor.js';
import { getSessionManager } from './session/sessionManager.js';
import { getSessionIdFromCLI } from './cli/args.js';
import { getUserInput } from './cli/prompt.js';
import { printAssistant, printInfo, printError } from './cli/console.js';
import { printWelcome } from './commands/welcome.js';
import { handleCommand } from './commandHandler.js';
import { initMcpClient, cleanupMcpClient } from './mcp/client.js';
import { AssistantRegistry } from './assistant/registry.js';

// Load environment variables
config();

/**
 * Initialize the chat application
 */
export async function initChat(): Promise<void> {
  // Print welcome banner
  printWelcome();

  // Register built-in assistants
  AssistantRegistry.registerBuiltinAssistants();

  // Get session manager
  const manager = getSessionManager();

  // Initialize MCP Client for tool calling
  try {
    printInfo('Connecting to MCP Server...');
    const mcpClient = await initMcpClient();
    manager.setMcpClient(mcpClient);
    
    const tools = mcpClient.listTools();
    printInfo(`MCP Client connected. Available tools: ${tools.map(t => t.name).join(', ')}`);
  } catch (error) {
    const err = error as Error;
    printError(`Warning: Could not connect to MCP Server: ${err.message}`);
    printInfo('Continuing without MCP tools...');
  }

  // Get CLI session ID if provided
  const cliSessionId = getSessionIdFromCLI();

  // Initialize session from CLI
  const session = manager.initializeFromCLI(cliSessionId);

  // Display session info
  if (cliSessionId) {
    printInfo(`Loaded session: ${session.id}`);
  } else {
    printInfo(`Started new session: ${session.id}`);
  }

  printInfo(`Using model: ${session.modelName}`);
  printInfo('Type /help for available commands\n');

  // Register cleanup handler
  process.on('exit', () => {
    manager.cleanupAndSave();
  });

  process.on('SIGINT', async () => {
    console.log('\n');
    printInfo('Saving session and cleaning up...');
    manager.cleanupAndSave();
    await cleanupMcpClient();
    process.exit(0);
  });
}

/**
 * Main chat loop
 */
export async function mainLoop(): Promise<void> {
  const manager = getSessionManager();

  while (true) {
    try {
      // Get user input
      const userInput = await getUserInput();

      // Skip empty input
      if (!userInput) {
        continue;
      }

      // Handle commands
      if (userInput.startsWith('/')) {
        const shouldExit = await handleCommand(userInput, manager);
        if (shouldExit) {
          break;
        }
        continue;
      }

      // Get current session
      const session = manager.getCurrentSession();

      // Send message to LLM (will use MCP tools if available)
      const response = await session.sendMessage(userInput);

      // Get token information
      const tokenInfo = session.getTokenInfo();

      // Display response
      printAssistant(`\n${session.assistantName}: ${response.text}`);
      printInfo(
        `Tokens: ${tokenInfo.total} (Pozostało: ${tokenInfo.remaining} / ${tokenInfo.max})`
      );

      // Save session
      const saveResult = session.saveToFile();
      if (!saveResult.success && saveResult.error) {
        printError(`Error saving session: ${saveResult.error}`);
      }
    } catch (error) {
      const err = error as Error;
      printError(`Error: ${err.message || String(error)}`);
      if (err.stack) {
        console.error(err.stack);
      }
    }
  }

  // Cleanup on exit
  manager.cleanupAndSave();
  await cleanupMcpClient();
}
