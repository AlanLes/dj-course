// Krok 8: Dodanie komend /assistant
// Subkomendy:

import { Assistant } from "../assistant/assistant.js";
import { AssistantRegistry } from "../assistant/registry.js";
import { printError, printHelp } from "../cli/console.js";
import { getSessionManager } from "../session/sessionManager.js";

// /assistant list - wyswietla liste dostepnych asystentow (id, nazwa)
// /assistant switch <id> - przelacza asystenta w biezacej sesji
// /assistant current - wyswietla aktualnego asystenta
// /assistant create <id> <name> - tworzy nowego asystenta dynamicznie (LLM generuje system prompt na podstawie nazwy/opisu, lub uzytkownik podaje prompt interaktywnie)
// Plik do edycji: src/commandHandler.ts - dodanie obslugu /assistant

export function listAssistantsCommand(): void {
  const assistants = AssistantRegistry.list();
  printHelp('\n--- Dostępne asystenci (ID) ---');
  for (const assistant of assistants) {
    printHelp(`- ID: ${assistant.id} (${assistant.name}, System role: ${assistant.systemPrompt.substring(0, 100)}...)`);
  }
  printHelp('------------------------------------');
}

export function switchAssistantCommand(assistantId: string): void {
  const sessionManager = getSessionManager();
  sessionManager.switchAssistant(assistantId);
  printHelp(`Asystent zmieniony na ${assistantId}`);
}

export function currentAssistantCommand(): void {
  const sessionManager = getSessionManager();
  try {
    const assistant = sessionManager.getCurrentSession().assistantName;
    printHelp(`Aktualny asystent: ${assistant}`);
  } catch (error) {
    printError(`Błąd: ${error}`);
  }
}

export function createAssistantCommand(assistantId: string, systemPrompt: string, name: string): void {
  const existingAssistant = AssistantRegistry.get(assistantId);
  if (existingAssistant) {
    printHelp(`Asystent ${assistantId} (${name}) już istnieje.`);
    return;
  }
  const assistant = new Assistant(assistantId, systemPrompt, name);
  AssistantRegistry.register(assistant);
  printHelp(`Asystent ${assistantId} (${name}) utworzony.`);
}