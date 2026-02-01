# Plan: Interaktywny dropdown dla komendy /switch

## Cel zadania

Rozbudowa komendy `/switch` w AZØR - dodanie interaktywnego dropdowna (lista z nawigacją klawiaturą) do wyboru sesji, gdy użytkownik wpisze `/switch` bez argumentu.

---

## 1. Zrozumienie architektury (TEORIA)

### 1.1 Flow obsługi komend w AZØR

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  chat.ts    │────▶│ commandHandler.ts │────▶│ Akcja (np.      │
│  (main loop)│     │ (routing)         │     │ switchToSession)│
└─────────────┘     └──────────────────┘     └─────────────────┘
```

1. **`chat.ts`** - główna pętla, wykrywa czy input zaczyna się od `/`
2. **`commandHandler.ts`** - dispatcher, który kieruje komendy do odpowiednich handlerów
3. **Akcje** - konkretne funkcje wykonujące logikę (np. `manager.switchToSession()`)

### 1.2 Kluczowe pliki

| Plik | Rola |
|------|------|
| `src/commandHandler.ts` | Obsługa wszystkich slash komend |
| `src/cli/prompt.ts` | Funkcje do interakcji z użytkownikiem (input, confirm, **selectFromList**) |
| `src/files/sessionFiles.ts` | Operacje na plikach sesji (**listSessions**) |
| `src/session/sessionManager.ts` | Zarządzanie sesjami (switch, create, etc.) |

### 1.3 Gotowe narzędzia (których użyjemy)

**`selectFromList()`** w `src/cli/prompt.ts` (linie 91-105):
```typescript
export async function selectFromList<T>(
  message: string,
  choices: Array<{ name: string; value: T }>
): Promise<T>
```
- Używa biblioteki `inquirer` (już zainstalowana!)
- Wyświetla listę z nawigacją strzałkami (góra/dół)
- Enter = wybór, zwraca `value` wybranej opcji

**`listSessions()`** w `src/files/sessionFiles.ts` (linie 115-153):
```typescript
export function listSessions(): SessionMetadata[]
```
Zwraca tablicę obiektów:
```typescript
{
  session_id: string;      // "abc123"
  model: string;           // "claude-3"
  message_count: number;   // 15
  last_modified: Date;     // Date object
  first_message?: string;  // "Cześć, potrzebuję pomocy z..."
}
```

---

## 2. Plan implementacji (PRAKTYKA)

### Krok 1: Zrozum obecną obsługę /switch

**Plik:** `src/commandHandler.ts` (linie 57-77)

Obecna logika:
```typescript
case '/switch':
  if (args.length === 0) {
    printError('Usage: /switch <SESSION_ID>');  // <- TU ZMIENIMY
  } else {
    const sessionId = args[0];
    const result = manager.switchToSession(sessionId);
    // ... obsługa rezultatu
  }
  return false;
```

**Co się dzieje:** Gdy brak argumentu = error. My chcemy: brak argumentu = pokaż dropdown.

---

### Krok 2: Stwórz nowy plik dla logiki wyboru sesji

**Utwórz:** `src/commands/sessionSelect.ts`

Ten plik będzie zawierał funkcję `selectSessionInteractive()`:

```typescript
/**
 * Interaktywny wybór sesji z dropdowna
 */

import { selectFromList } from '../cli/prompt.js';
import { listSessions } from '../files/sessionFiles.js';
import { printInfo, printError } from '../cli/console.js';
import type { SessionManager } from '../session/sessionManager.js';

/**
 * Formatuje pojedynczą sesję do wyświetlenia w dropdown
 */
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

/**
 * Wyświetla interaktywny dropdown z sesjami
 * @returns ID wybranej sesji lub null jeśli brak sesji
 */
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
```

**Dlaczego osobny plik?**
- Separation of Concerns - każdy plik ma jedną odpowiedzialność
- Łatwiejsze testowanie
- Reużywalność (może się przydać w innych komendach)

---

### Krok 3: Zmodyfikuj commandHandler.ts

**Plik:** `src/commandHandler.ts`

**Zmiana 1:** Dodaj import na górze pliku (po linii 8):
```typescript
import { selectSessionInteractive } from './commands/sessionSelect.js';
```

**Zmiana 2:** Zmień funkcję `handleCommand` na `async`:
```typescript
// PRZED:
export function handleCommand(
  userInput: string,
  manager: SessionManager
): boolean {

// PO:
export async function handleCommand(
  userInput: string,
  manager: SessionManager
): Promise<boolean> {
```

**Zmiana 3:** Zmień obsługę `/switch` (linie 57-77):
```typescript
case '/switch':
  if (args.length === 0) {
    // NOWE: Interaktywny wybór sesji
    const selectedId = await selectSessionInteractive();
    if (selectedId === null) {
      printInfo('Anulowano wybór sesji.');
      return false;
    }
    // Użyj wybranego ID do przełączenia
    const result = manager.switchToSession(selectedId);
    if (result.loadSuccessful) {
      printSuccess(`Switched to session ${selectedId}`);
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
  } else {
    // Istniejąca logika: ręcznie podane ID
    const sessionId = args[0];
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
  return false;
```

---

### Krok 4: Zaktualizuj chat.ts

**Plik:** `src/chat.ts`

Ponieważ `handleCommand` staje się `async`, musisz dodać `await`:

Znajdź miejsce gdzie wywoływany jest `handleCommand` i dodaj `await`:
```typescript
// PRZED:
const shouldExit = handleCommand(userInput, manager);

// PO:
const shouldExit = await handleCommand(userInput, manager);
```

---

### Krok 5: Refaktoryzacja (DRY)

Zauważ, że kod obsługi switchowania jest zduplikowany. Wyekstrahuj go do funkcji:

**W `commandHandler.ts`**, dodaj helper:
```typescript
/**
 * Wykonaj przełączenie sesji i wyświetl feedback
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
```

Wtedy case `/switch` stanie się czytelniejszy:
```typescript
case '/switch':
  if (args.length === 0) {
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
```

---

## 3. Testowanie

Po implementacji przetestuj:

1. **`/switch` bez argumentu** - powinien pokazać dropdown z sesjami
2. **Nawigacja strzałkami** - góra/dół powinny zmieniać zaznaczenie
3. **Enter** - powinien wybrać sesję i przełączyć
4. **Anuluj** - powinien wrócić do normalnego promptu
5. **`/switch abc123`** - powinien działać jak wcześniej (ręczne ID)
6. **Brak sesji** - powinien wyświetlić komunikat "Brak zapisanych sesji"

---

## 4. Podsumowanie nauki

Po wykonaniu tego zadania nauczysz się:

1. **Architektury obsługi komend** - jak przepływa input od użytkownika do akcji
2. **Używania inquirer** - biblioteki do interaktywnych CLI
3. **Separation of Concerns** - każdy plik ma jedną odpowiedzialność
4. **Refaktoryzacji DRY** - ekstrakcja powtarzającego się kodu
5. **Async/await w praktyce** - zmiana synchronicznej funkcji na asynchroniczną

---

## Checklist implementacji

- [ ] Utwórz `src/commands/sessionSelect.ts`
- [ ] Zaimportuj `selectSessionInteractive` w `commandHandler.ts`
- [ ] Zmień `handleCommand` na `async`
- [ ] Zmodyfikuj obsługę `/switch`
- [ ] Zaktualizuj wywołanie w `chat.ts` (dodaj `await`)
- [ ] (Opcjonalnie) Wyekstrahuj `performSwitch` helper
- [ ] Przetestuj wszystkie scenariusze
