import type { MCPTool } from '../types/index.js';
import { getUserInput } from '../cli/prompt.js';
import { printAssistant, printInfo } from '../cli/console.js';

/**
 * Nazwa narzędzia jako stała — używana do rozpoznawania tool calli
 */
export const CLARIFICATION_TOOL_NAME = 'ask_user_clarification';

/**
 * Definicja narzędzia do dopytywania użytkownika.
 *
 * Model wywoła to narzędzie, gdy uzna, że pytanie jest nieprecyzyjne.
 * Parametr `question` to pytanie, które AZOR chce zadać użytkownikowi.
 */
export const ASK_USER_CLARIFICATION_TOOL: MCPTool = {
  name: CLARIFICATION_TOOL_NAME,
  description:
    'Użyj tego narzędzia, gdy pytanie użytkownika jest niejasne, nieprecyzyjne lub wieloznaczne. ' +
    'Narzędzie wyświetli pytanie doprecyzowujące użytkownikowi i zwróci jego odpowiedź. ' +
    'Używaj tego ZAMIAST zgadywania, gdy nie masz pewności, o co dokładnie chodzi użytkownikowi.',
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'Pytanie doprecyzowujące do zadania użytkownikowi. Powinno być konkretne i pomocne.',
      },
    },
    required: ['question'],
  },
};

/**
 * Handler dla narzędzia ask_user_clarification.
 *
 * Wyświetla pytanie doprecyzowujące od AZØRA i czeka na odpowiedź użytkownika.
 * Odpowiedź wraca do modelu jako tool_result.
 */
export async function handleClarificationToolCall(
  toolInput: Record<string, unknown>
): Promise<string> {
  const question = toolInput.question as string;

  // Wyświetl pytanie doprecyzowujące od AZØRA
  printAssistant(`\n🐕 AZOR dopytuje: ${question}`);
  printInfo('(Odpowiedz poniżej, aby AZOR mógł lepiej Ci pomóc)\n');

  // Pobierz odpowiedź użytkownika
  const userClarification = await getUserInput('Twoja odpowiedź: ');

  // Zwróć odpowiedź jako wynik narzędzia (trafi do modelu jako tool_result)
  return userClarification || '(użytkownik nie podał odpowiedzi)';
}