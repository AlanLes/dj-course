import inquirer from 'inquirer';
import { AssistantRegistry } from '../assistant/registry.js';
import { RolePlayingDialog } from '../roleplay/index.js';
import { getSelectedLLMClient } from '../session/chatSession.js';
import { printAssistant, printError, printInfo, printSuccess, printWarning } from '../cli/console.js';
import { getConfirmation, checkboxFromList } from '../cli/prompt.js';
import type { Assistant } from '../assistant/assistant.js';
import type { RolePlayingConfig } from '../types/index.js';

const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

/**
 * Start role-playing dialog interactive setup
 */
export async function startRolePlayingDialog(): Promise<void> {
  // 1. Get available assistants
  const assistants = AssistantRegistry.list();
  if (assistants.length < 2) {
    printError('Potrzeba co najmniej 2 asystentow do dialogu.');
    return;
  }

  // 2. Let user select participants (min 2)
  const choices = assistants.map(a => ({ name: `${a.name} (${a.id})`, value: a }));
  const selectedAssistants = await checkboxFromList<Assistant>(
    'Wybierz uczestnikow dialogu (min. 2):',
    choices
  );

  if (selectedAssistants.length < 2) {
    printError('Anulowano - wybrano mniej niz 2 asystentow.');
    return;
  }

  // 3. Get initial prompt
  const { initialPrompt } = await inquirer.prompt([{
    type: 'input',
    name: 'initialPrompt',
    message: 'Podaj temat rozmowy (initial prompt):',
    validate: (input: string) => input.trim().length > 0 || 'Temat nie moze byc pusty',
  }]);

  // 4. Get optional turn limit
  const { maxTurns } = await inquirer.prompt([{
    type: 'number',
    name: 'maxTurns',
    message: 'Limit tur (0 = bez limitu):',
    default: 0,
  }]);

  // 5. Create dialog
  const llmClient = getSelectedLLMClient();
  const config: Partial<RolePlayingConfig> = {
    maxTurns: maxTurns || 0,
    maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
  };

  const dialog = new RolePlayingDialog(
    selectedAssistants,
    initialPrompt.trim(),
    llmClient,
    config
  );

  // 6. Show participants
  printSuccess(`\nRozpoczynamy dialog miedzy: ${selectedAssistants.map(a => a.name).join(', ')}`);
  printInfo(`Temat: ${initialPrompt}`);
  if (maxTurns > 0) {
    printInfo(`Limit tur: ${maxTurns}`);
  }
  printInfo('---\n');

  // 7. Run dialog loop
  await runDialogLoop(dialog);
}

/**
 * Main dialog loop with error handling
 */
async function runDialogLoop(dialog: RolePlayingDialog): Promise<void> {
  while (true) {
    try {
      const result = await dialog.executeTurn();

      // Display response
      printAssistant(`\n[${result.assistantName}]: ${result.text}`);
      printInfo(`(tura ${result.turnNumber + 1})`);

      // Check if we hit the limit
      if (result.isLastTurn) {
        printWarning('\nOsiagnieto limit tur. Dialog zakonczony.');
        break;
      }

      // Ask to continue
      const shouldContinue = await getConfirmation('Kontynuowac dialog?');
      if (!shouldContinue) {
        printInfo('Dialog zakonczony przez uzytkownika.');
        break;
      }

    } catch (error) {
      const err = error as Error;
      printError(`\nBlad podczas tury: ${err.message}`);

      const retry = await getConfirmation('Sprobowac ponownie?');
      if (!retry) {
        printInfo('Dialog przerwany z powodu bledu.');
        break;
      }
      // On retry, we just continue the loop (same turn will be attempted)
    }
  }
}