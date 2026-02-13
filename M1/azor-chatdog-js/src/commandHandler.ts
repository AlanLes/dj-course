/**
 * Command handler for slash commands
 */

import { displayHelp, printError, printInfo, printSuccess } from './cli/console.js';
import { displaySessionList } from './commands/sessionList.js';
import { displaySessionHistory } from './commands/sessionDisplay.js';
import { removeCurrentSession } from './commands/sessionRemove.js';
import { selectSessionInteractive } from './commands/sessionSelect.js';
import type { SessionManager } from './session/sessionManager.js';
import { createAssistantCommand, currentAssistantCommand, listAssistantsCommand, switchAssistantCommand } from './commands/assistant.js';

/**
 * Valid slash commands
 */
const VALID_SLASH_COMMANDS = [
  '/exit',
  '/quit',
  '/switch',
  '/help',
  '/session',
  '/pdf',
  '/assistant',
];

/**
 * Perform session switch and display feedback
 */
function performSwitch(sessionId: string, manager: SessionManager): void {
  const result = manager.switchToSession(sessionId);
  
  if (result.loadSuccessful) {
    printSuccess(`Switched to session ${sessionId}`);
    if (result.hasHistory) {
      const session = result.session;
      const tokenInfo = session.getTokenInfo();
      printInfo(
        `Session has ${session.getHistory().length} messages (${tokenInfo.total} tokens)`
      );
    }
  } else {
    printError(`Failed to switch: ${result.error}`);
  }
}

/**
 * Handle a slash command
 * @returns true if should exit, false otherwise
 */
export async function handleCommand(
  userInput: string,
  manager: SessionManager
): Promise<boolean> {
  const parts = userInput.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Check if it's a valid command
  if (!VALID_SLASH_COMMANDS.some((cmd) => command.startsWith(cmd))) {
    printError(`Unknown command: ${command}`);
    printInfo('Type /help for available commands');
    return false;
  }

  // Handle commands
  switch (command) {
    case '/exit':
    case '/quit':
      printInfo('Do widzenia!');
      return true;

    case '/help':
      displayHelp(manager.getCurrentSession().id);
      return false;

    case '/session':
      handleSessionSubcommand(args, manager);
      return false;

    case '/switch':
      if (args.length === 0) {
        // NOWE: Interaktywny wybór sesji
        const selectedId = await selectSessionInteractive();
        if (selectedId === null) {
          printInfo('Anulowano wybór sesji.');
          return false;
        }
        performSwitch(selectedId, manager);
      } else {
        performSwitch(args[0], manager);
      }
      return false;

    case '/pdf':
      printError('PDF export not yet implemented');
      return false;

    case '/assistant':
      handleAssistantSubcommand(args, manager);
      return false;

    default:
      printError(`Unknown command: ${command}`);
      return false;
  }
}

/**
 * Handle /session subcommands
 */
function handleSessionSubcommand(args: string[], manager: SessionManager): void {
  if (args.length === 0) {
    printError('Usage: /session <list|display|new|clear|pop|remove>');
    return;
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'list':
      displaySessionList();
      break;

    case 'display':
      displaySessionHistory(manager.getCurrentSession());
      break;

    case 'new':
      const createResult = manager.createNewSession(true);
      printSuccess(`Created new session: ${createResult.session.id}`);
      break;

    case 'clear':
      manager.getCurrentSession().clearHistory();
      printSuccess('Session history cleared');
      break;

    case 'pop':
      if (manager.getCurrentSession().popLastExchange()) {
        printSuccess('Removed last message exchange');
      } else {
        printInfo('No messages to remove');
      }
      break;

    case 'remove':
      removeCurrentSession(manager);
      break;

    default:
      printError(`Unknown subcommand: ${subcommand}`);
      printInfo('Available: list, display, new, clear, pop, remove');
  }
}

/**
 * Handle /assistant subcommands
 */
function handleAssistantSubcommand(args: string[], manager: SessionManager): void {
  if (args.length === 0) {
    printError('Usage: /assistant <list|switch|current|create>');
    return;
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'list':
      listAssistantsCommand();
      break;

    case 'switch':
      if (args.length < 2) {
        printError('Usage: /assistant switch <id>');
        return;
      }
      switchAssistantCommand(args[1]);
      break;

    case 'current':
      currentAssistantCommand();
      break;

    case 'create':
      if (args.length < 4) {
        printError('Usage: /assistant create <id> <name> <systemPrompt>');
        return;
      }
      createAssistantCommand(args[1], args[2], args[3]);
      break;

    default:
      printError(`Unknown subcommand: ${subcommand}`);
      printInfo('Available: list, switch, current, create');
  }
}