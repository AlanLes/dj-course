import { selectFromList } from '../cli/prompt.js';
import { listSessions } from '../files/sessionFiles.js';
import { printInfo } from '../cli/console.js';

// Formatuje pojedynczą sesję do wyświetlenia w dropdown
function formatSessionChoice(session: {
  session_id: string;
  model: string;
  message_count: number;
  last_modified: Date;
  first_message?: string;
}): { name: string; value: string } {
  // Skróć first_message do 40 znaków
  const preview = session.first_message 
    ? session.first_message.substring(0, 40) + (session.first_message.length > 40 ? '...' : '')
    : 'Pusta sesja';
  
  // Format: "[ID] Model | X msgs | Preview..."
  const name = `[${session.session_id.substring(0, 8)}] ${session.model} | ${session.message_count} msgs | ${preview}`;
  
  return {
    name,
    value: session.session_id,
  };
}

// Wyświetla interaktywny dropdown z sesjami
// @returns ID wybranej sesji lub null jeśli brak sesji
export async function selectSessionInteractive(): Promise<string | null> {
  const sessions = listSessions();
  
  if (sessions.length === 0) {
    printInfo('Brak zapisanych sesji do wyboru.');
    return null;
  }
  
  // Przygotuj choices dla inquirer
  const choices = sessions.map(formatSessionChoice);
  
  // Dodaj opcję anulowania
  choices.push({
    name: '← Anuluj',
    value: '__CANCEL__',
  });
  
  const selected = await selectFromList<string>(
    'Wybierz sesję do przełączenia:',
    choices
  );
  
  if (selected === '__CANCEL__') {
    return null;
  }
  
  return selected;
}