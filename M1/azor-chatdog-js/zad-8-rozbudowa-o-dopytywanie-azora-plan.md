# Zadanie 8: "Doprecyzuj pytanie, użytkowniku…" - Plan implementacji

## Cel

Rozbudować AZØRA o mechanizm **dopytywania użytkownika**. Gdy model LLM uzna, że pytanie
jest niewystarczająco precyzyjne, zamiast zgadywać — wywoła **tool call**, który poprosi
użytkownika o doprecyzowanie pytania w terminalu.

---

## Teoria: Dlaczego tool call, a nie zwykła odpowiedź?

Mógłbyś zapytać: "Czemu model nie może po prostu odpowiedzieć tekstem «doprecyzuj pytanie»?"

Otóż **może** — ale to ma wady:
- Taki tekst trafia do historii jako zwykła odpowiedź asystenta
- Użytkownik musiałby napisać nową wiadomość, która zaczyna **nową turę** konwersacji
- Model traci kontekst "jestem w trakcie przetwarzania tego pytania"

Z **tool callem** jest eleganciej:
1. Model **nie kończy swojej tury** — zatrzymuje się z `stop_reason: "tool_use"`
2. Nasz kod pyta użytkownika w terminalu o doprecyzowanie
3. Odpowiedź użytkownika wraca do modelu jako **tool_result** (wynik narzędzia)
4. Model **kontynuuje swoją turę** — teraz z pełniejszym kontekstem generuje właściwą odpowiedź
5. Z perspektywy historii konwersacji to wciąż **jedna wymiana** user→assistant

To jest wzorzec znany jako **"human-in-the-loop" tool calling**.

---

## Architektura obecnego kodu (co musisz wiedzieć)

### Przepływ wiadomości (obecny)

```
Użytkownik wpisuje tekst
    ↓
chat.ts: mainLoop()
    ↓
chatSession.ts: sendMessage(text)
    ↓
Sprawdzenie: czy mamy MCP tools i czy LLM wspiera tools?
    ├── TAK → sendMessageWithTools(text, mcpTools, onToolCall)
    │         ↓
    │         LLM odpowiada z tool_use → onToolCall → mcpClient.callTool()
    │         ↓
    │         Tool result wraca do LLM → LLM generuje finalną odpowiedź
    │
    └── NIE → sendMessage(text)
              ↓
              LLM odpowiada tekstem
```

### Kluczowe pliki

| Plik | Rola |
|------|------|
| `src/types/index.ts` | Interfejsy: `MCPTool`, `ToolCallHandler`, `ILLMChatSessionWithTools` |
| `src/session/chatSession.ts` | Orkiestracja — decyduje czy użyć tools, składa listę narzędzi |
| `src/llm/anthropicClient.ts` | `sendMessageWithTools()` — pętla tool-calling dla Anthropic |
| `src/llm/geminiClient.ts` | Tylko `sendMessage()` — **brak obsługi tools** (do dodania!) |
| `src/mcp/client.ts` | MCP client — callTool() wysyła do MCP servera |
| `src/cli/prompt.ts` | `getUserInput()` — odczyt z terminala |
| `src/assistant/azor.ts` | System prompt AZØRA |

### Interfejs tool callingu (obecny)

```typescript
// types/index.ts
interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

type ToolCallHandler = (
  toolName: string,
  toolInput: Record<string, unknown>
) => Promise<string>;

interface ILLMChatSessionWithTools extends ILLMChatSession {
  sendMessageWithTools(
    text: string,
    tools: MCPTool[],
    onToolCall: ToolCallHandler
  ): Promise<LLMResponse>;
}
```

---

## Plan implementacji — krok po kroku

---

### KROK 1: Zdefiniuj narzędzie `ask_user_clarification`

**Plik:** `src/tools/clarification.ts` (nowy plik)

**Co robimy:**
Tworzymy definicję narzędzia (tool) w formacie `MCPTool`, które model będzie mógł wywołać.
To nie jest prawdziwe narzędzie MCP — to **lokalne narzędzie**, ale ma taki sam kształt,
więc model nie widzi różnicy.

**Definicja narzędzia:**

```typescript
import type { MCPTool } from '../types/index.js';

/**
 * Definicja narzędzia do dopytywania użytkownika.
 *
 * Model wywoła to narzędzie, gdy uzna, że pytanie jest nieprecyzyjne.
 * Parametr `question` to pytanie, które AZOR chce zadać użytkownikowi.
 */
export const ASK_USER_CLARIFICATION_TOOL: MCPTool = {
  name: 'ask_user_clarification',
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
 * Nazwa narzędzia jako stała — używana do rozpoznawania tool calli
 */
export const CLARIFICATION_TOOL_NAME = 'ask_user_clarification';
```

**Czego się tutaj uczysz:**
- Jak wygląda definicja narzędzia (tool) — to jest **JSON Schema** opisujący parametry
- `inputSchema` mówi modelowi, jakie argumenty może przekazać
- `description` jest kluczowe — model czyta ten opis, żeby wiedzieć KIEDY użyć narzędzia

---

### KROK 2: Zaimplementuj handler — funkcja pytająca użytkownika

**Plik:** `src/tools/clarification.ts` (kontynuacja tego samego pliku)

**Co robimy:**
Piszemy funkcję, która zostanie wywołana, gdy model użyje narzędzia `ask_user_clarification`.
Ta funkcja wyświetla pytanie modelu w terminalu i czeka na odpowiedź użytkownika.

```typescript
import { getUserInput } from '../cli/prompt.js';
import { printAssistant, printInfo } from '../cli/console.js';

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
```

**Czego się tutaj uczysz:**
- Handler tool calla to **zwykła async funkcja**, która zwraca string
- Ten string trafi do modelu LLM jako `tool_result` — model go przeczyta i użyje
- `getUserInput()` to ta sama funkcja, która służy do normalnego inputu w chat loop
- Cały flow jest synchroniczny z perspektywy modelu: wywołał tool → dostał wynik → kontynuuje

---

### KROK 3: Zmodyfikuj `chatSession.ts` — wstrzyknij narzędzie i rozdziel handlery

**Plik:** `src/session/chatSession.ts`

**Co robimy:**
To najważniejsza zmiana. Musisz:

1. **Dodać `ask_user_clarification` do listy narzędzi** wysyłanych do modelu
2. **Rozdzielić handler** — rozpoznać, czy tool call to nasze lokalne narzędzie czy MCP tool

**Zmiany w `sendMessage()`:**

```typescript
// NOWE importy na górze pliku:
import {
  ASK_USER_CLARIFICATION_TOOL,
  CLARIFICATION_TOOL_NAME,
  handleClarificationToolCall,
} from '../tools/clarification.js';
```

Następnie w metodzie `sendMessage()` zmień logikę budowania listy narzędzi i handlera:

```typescript
async sendMessage(text: string): Promise<LLMResponse> {
  let response: LLMResponse;

  // Sprawdź czy LLM wspiera tool calling
  const llmSupportsTools = supportsTools(this.llmChatSession);

  if (llmSupportsTools) {
    // === BUDUJ LISTĘ NARZĘDZI ===

    // 1. Zawsze dodaj narzędzie do doprecyzowania
    const allTools: MCPTool[] = [ASK_USER_CLARIFICATION_TOOL];

    // 2. Dodaj narzędzia MCP (jeśli dostępne)
    const hasMcpTools =
      this.mcpClient &&
      this.mcpClient.isConnected() &&
      this.mcpClient.hasTools();

    if (hasMcpTools) {
      allTools.push(...this.mcpClient!.listTools());
    }

    // === HANDLER TOOL CALLI ===
    const onToolCall = async (
      toolName: string,
      toolInput: Record<string, unknown>
    ): Promise<string> => {
      // Rozpoznaj: czy to nasze lokalne narzędzie?
      if (toolName === CLARIFICATION_TOOL_NAME) {
        return await handleClarificationToolCall(toolInput);
      }

      // Pozostałe → MCP
      if (hasMcpTools) {
        return await this.mcpClient!.callTool(toolName, toolInput);
      }

      return `Nieznane narzędzie: ${toolName}`;
    };

    response = await (
      this.llmChatSession as ILLMChatSessionWithTools
    ).sendMessageWithTools(text, allTools, onToolCall);
  } else {
    // LLM nie wspiera tools — zwykłe wysłanie
    response = await this.llmChatSession.sendMessage(text);
  }

  // Reszta bez zmian (sync history, WAL log)
  this.history = this.llmChatSession.getHistory();

  const totalTokens = this.countTokens();
  appendToWAL(
    this.sessionId,
    text,
    response.text,
    totalTokens,
    this.llmClient.getModelName()
  );

  return response;
}
```

**Kluczowa zmiana logiczna:**

Wcześniej warunek na tool calling wymagał MCP:
```typescript
// STARE:
const canUseTools = this.mcpClient && this.mcpClient.isConnected() && this.mcpClient.hasTools() && supportsTools(...)
```

Teraz wystarczy, że LLM wspiera tools:
```typescript
// NOWE:
const llmSupportsTools = supportsTools(this.llmChatSession);
```

Bo nawet bez MCP mamy nasze lokalne narzędzie `ask_user_clarification`.

**Czego się tutaj uczysz:**
- **Routing tool calli** — jeden handler, ale wewnątrz `if/else` na podstawie `toolName`
- **Kompozycja narzędzi** — łączysz narzędzia z różnych źródeł (lokalne + MCP) w jedną listę
- Model LLM nie wie i nie musi wiedzieć, skąd pochodzi narzędzie — to **abstrakcja**

---

### KROK 4: Dodaj obsługę tool calling do Gemini

**Plik:** `src/llm/geminiClient.ts`

**Dlaczego?**
Aktualnie `GeminiChatSessionWrapper` implementuje tylko `ILLMChatSession` (bez tools).
Klasa Anthropic już ma `sendMessageWithTools()`, ale Gemini — nie.

Gemini API wspiera function calling, ale inaczej niż Anthropic:

| Koncept | Anthropic | Gemini |
|---------|-----------|--------|
| Definicja narzędzia | `tools: [{name, input_schema}]` | `tools: [{functionDeclarations: [{name, parameters}]}]` |
| Model chce wywołać tool | `stop_reason: "tool_use"`, `content: [{type: "tool_use"}]` | `response.functionCalls()` zwraca listę |
| Wynik tool'a odsyłamy jako | `{role: "user", content: [{type: "tool_result"}]}` | `{role: "function", parts: [{functionResponse: {...}}]}` |

**Zmiany:**

1. Zmień klasę `GeminiChatSessionWrapper` aby implementowała `ILLMChatSessionWithTools`
2. Dodaj metodę `sendMessageWithTools()`

```typescript
import {
  GoogleGenerativeAI,
  Content,
  FunctionDeclarationSchemaType,
  Tool as GeminiTool,
  Part,
} from '@google/generative-ai';

// ...

class GeminiChatSessionWrapper implements ILLMChatSessionWithTools {

  // ... istniejące pola i metody ...

  /**
   * Konwertuj MCPTool[] na format narzędzi Gemini
   */
  private convertToolsToGemini(tools: MCPTool[]): GeminiTool[] {
    return [
      {
        functionDeclarations: tools.map((tool) => ({
          name: tool.name,
          description: tool.description || '',
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: (tool.inputSchema.properties as Record<string, any>) || {},
            required: (tool.inputSchema.required as string[]) || [],
          },
        })),
      },
    ];
  }

  async sendMessageWithTools(
    text: string,
    tools: MCPTool[],
    onToolCall: ToolCallHandler
  ): Promise<LLMResponse> {
    // Gemini wymaga podania tools przy tworzeniu modelu, ale możemy też
    // przekazać je w sendMessage jako parametr generacji.
    // Prostsze podejście: użyj model.generateContent z tools.

    const geminiTools = this.convertToolsToGemini(tools);

    // Dodaj wiadomość użytkownika do historii
    this.history.push({ role: 'user', parts: [{ text }] });

    // Pętla tool calling (analogiczna do Anthropic)
    let continueLoop = true;
    let finalResponseText = '';

    // Buduj historię w formacie Gemini Content[]
    const geminiHistory: Content[] = this.history.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts.map((p) => ({ text: p.text })),
    }));

    while (continueLoop) {
      // Wyślij z narzędziami
      const result = await this.geminiSession.sendMessage(
        geminiHistory[geminiHistory.length - 1].parts.map(p => p.text).join(''),
      );
      const response = result.response;

      // Sprawdź czy model chce wywołać function
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        // Model chce wywołać narzędzie(a)
        // Dodaj odpowiedź modelu do historii
        geminiHistory.push({
          role: 'model',
          parts: response.candidates[0].content.parts,
        });

        // Wywołaj każde narzędzie i zbierz wyniki
        const functionResponseParts: Part[] = [];
        for (const fc of functionCalls) {
          const toolResult = await onToolCall(fc.name, fc.args as Record<string, unknown>);
          functionResponseParts.push({
            functionResponse: {
              name: fc.name,
              response: { result: toolResult },
            },
          } as Part);
        }

        // Dodaj wyniki narzędzi do historii
        geminiHistory.push({
          role: 'user',   // W Gemini function responses idą jako "user" (lub "function")
          parts: functionResponseParts,
        });
      } else {
        // Brak function calls → mamy finalną odpowiedź
        continueLoop = false;
        finalResponseText = response.text();
      }
    }

    // Dodaj odpowiedź do uniwersalnej historii
    this.history.push({
      role: 'model',
      parts: [{ text: finalResponseText }],
    });

    return { text: finalResponseText };
  }
}
```

> **UWAGA:** Powyższy kod jest punktem wyjścia. Gemini API w wersji `@google/generative-ai`
> ma specyfiki — możliwe że trzeba będzie tworzyć nowy model z `tools` w konfiguracji zamiast
> przekazywać je per-request. Przetestuj i dostosuj. Kluczowe jest zrozumienie wzorca:
> **pętla: wyślij → sprawdź functionCalls → wywołaj handler → odeślij wynik → powtórz**.

**Czego się tutaj uczysz:**
- Każdy provider LLM ma **inny format** tool callingu, ale **wzorzec jest ten sam**
- Konwersja formatów narzędzi (MCPTool → GeminiTool vs MCPTool → AnthropicTool) to adapter pattern
- Pętla tool calling jest analogiczna we wszystkich klientach

---

### KROK 5: Zaktualizuj system prompt AZØRA

**Plik:** `src/assistant/azor.ts`

**Co robimy:**
Dodajemy do system promptu informację, że AZOR powinien **dopytywać** gdy pytanie jest nieprecyzyjne.
Model musi wiedzieć, że ma takie narzędzie i **kiedy** go używać.

```typescript
export function createAzorAssistant(): Assistant {
  const assistantName = 'AZOR';
  const systemRole = `Jesteś pomocnym asystentem, Nazywasz się Azor i jesteś psem o wielkich możliwościach. Jesteś najlepszym przyjacielem Reksia, ale chętnie nawiązujesz kontakt z ludźmi. Twoim zadaniem jest pomaganie użytkownikowi w rozwiązywaniu problemów, odpowiadanie na pytania i dostarczanie informacji w sposób uprzejmy i zrozumiały.

WAŻNE — Doprecyzowanie pytań:
Jeśli pytanie użytkownika jest niejasne, wieloznaczne lub brakuje w nim kluczowych szczegółów,
MUSISZ użyć narzędzia "ask_user_clarification", aby dopytać użytkownika zanim odpowiesz.
NIE ZGADUJ — dopytaj. Przykłady sytuacji, gdy należy dopytać:
- Użytkownik pyta o "to" bez podania kontekstu
- Pytanie można zinterpretować na kilka sposobów
- Brakuje kluczowych parametrów (np. język programowania, system operacyjny, wersja)
- Temat jest zbyt szeroki, żeby dać sensowną odpowiedź bez zawężenia

Gdy pytanie jest jasne i jednoznaczne, odpowiadaj od razu — nie dopytuj niepotrzebnie.`;

  return new Assistant(systemRole, assistantName);
}
```

**Czego się tutaj uczysz:**
- **System prompt** to Twój główny mechanizm sterowania zachowaniem modelu
- Sam opis narzędzia (`description` w MCPTool) to nie wszystko — model potrzebuje też
  kontekstu w system prompcie, **kiedy** i **dlaczego** używać narzędzia
- Dobra praktyka: podaj **przykłady** sytuacji (few-shot guidance w system prompcie)

---

### KROK 6: Utwórz plik `src/tools/index.ts`

**Plik:** `src/tools/index.ts` (nowy plik)

Barrel export dla modułu tools:

```typescript
export {
  ASK_USER_CLARIFICATION_TOOL,
  CLARIFICATION_TOOL_NAME,
  handleClarificationToolCall,
} from './clarification.js';
```

---

### KROK 7: Przetestuj

Scenariusze testowe do ręcznego przetestowania:

#### Test 1: Pytanie nieprecyzyjne
```
TY: Jak to zrobić?
→ AZOR powinien dopytać (tool call): "Co dokładnie chciałbyś zrobić? Podaj więcej szczegółów."
→ Odpowiadasz: "Chcę posortować listę w Pythonie"
→ AZOR odpowiada merytorycznie o sortowaniu w Pythonie
```

#### Test 2: Pytanie precyzyjne
```
TY: Jak posortować listę liczb w Pythonie malejąco?
→ AZOR odpowiada od razu (BEZ dopytywania)
```

#### Test 3: Pytanie wieloznaczne
```
TY: Jak zrobić serwer?
→ AZOR powinien dopytać: "W jakim języku/technologii? HTTP, WebSocket, TCP? Do czego ma służyć?"
→ Odpowiadasz: "HTTP w Node.js z Express"
→ AZOR odpowiada merytorycznie
```

#### Test 4: Kilka dopytań z rzędu (edge case)
```
TY: Zrób mi coś fajnego
→ AZOR dopytuje: "Co chciałbyś, żebym zrobił?"
→ Odpowiadasz: "Program"
→ AZOR może dopytać ponownie: "Jaki program? W jakim języku? Co ma robić?"
→ Odpowiadasz: "Gra w zgadywanie liczb w Pythonie"
→ AZOR odpowiada kodem
```

---

## Podsumowanie zmian w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/tools/clarification.ts` | **NOWY** | Definicja tool'a + handler (pytanie w CLI) |
| `src/tools/index.ts` | **NOWY** | Barrel export |
| `src/session/chatSession.ts` | **MODYFIKACJA** | Wstrzyknięcie tool'a + routing handlerów |
| `src/llm/geminiClient.ts` | **MODYFIKACJA** | Dodanie `sendMessageWithTools()` |
| `src/assistant/azor.ts` | **MODYFIKACJA** | Rozszerzenie system promptu |

**Pliki, które NIE wymagają zmian:**
- `src/llm/anthropicClient.ts` — już ma `sendMessageWithTools()`, działa out-of-the-box
- `src/types/index.ts` — istniejące interfejsy wystarczą
- `src/mcp/*` — MCP nie jest modyfikowany, tylko współistnieje
- `src/chat.ts` — główna pętla nie wymaga zmian (tool handling jest w chatSession)

---

## Diagram sekwencji (nowy flow)

```
Użytkownik               AZOR (chat.ts)              LLM                    clarification handler
    │                         │                        │                           │
    │  "Jak to zrobić?"       │                        │                           │
    │────────────────────────>│                        │                           │
    │                         │  sendMessageWithTools() │                           │
    │                         │───────────────────────>│                           │
    │                         │                        │                           │
    │                         │  tool_use:             │                           │
    │                         │  ask_user_clarification│                           │
    │                         │  {question: "Co...?"}  │                           │
    │                         │<───────────────────────│                           │
    │                         │                        │                           │
    │                         │  handleClarificationToolCall()                     │
    │                         │───────────────────────────────────────────────────>│
    │                         │                                                    │
    │  "🐕 AZOR dopytuje:     │                                                    │
    │   Co dokładnie chcesz   │                                                    │
    │   zrobić?"              │                                                    │
    │<─────────────────────────────────────────────────────────────────────────────│
    │                         │                                                    │
    │  "Sortować listę w JS"  │                                                    │
    │─────────────────────────────────────────────────────────────────────────────>│
    │                         │                                                    │
    │                         │  tool_result: "Sortować listę w JS"                │
    │                         │<──────────────────────────────────────────────────-│
    │                         │                        │                           │
    │                         │  tool_result ─────────>│                           │
    │                         │                        │                           │
    │                         │  end_turn: "Oto jak    │                           │
    │                         │  posortować listę..."  │                           │
    │                         │<───────────────────────│                           │
    │                         │                        │                           │
    │  "AZOR: Oto jak         │                        │                           │
    │  posortować listę w JS" │                        │                           │
    │<────────────────────────│                        │                           │
```

---

## Kolejność implementacji (rekomendowana)

1. **Krok 1+2** — stwórz `src/tools/clarification.ts` (tool definition + handler)
2. **Krok 6** — stwórz `src/tools/index.ts`
3. **Krok 3** — zmodyfikuj `chatSession.ts` (wstrzyknięcie + routing)
4. **Krok 5** — zaktualizuj system prompt w `azor.ts`
5. **Krok 7** — przetestuj z Anthropic (powinno od razu działać!)
6. **Krok 4** — dodaj `sendMessageWithTools()` do Gemini (jeśli używasz Gemini)
7. Przetestuj z Gemini

Zaczynamy od Anthropic, bo tam **tool calling już działa** — wystarczy wstrzyknąć
nowe narzędzie. Gemini to osobny krok, bo wymaga napisania nowej metody.

---

## Słowniczek pojęć

| Termin | Znaczenie |
|--------|-----------|
| **Tool call / Function call** | Mechanizm, w którym model LLM zamiast odpowiedzieć tekstem, "wywołuje funkcję" z parametrami. Nasz kod wykonuje tę funkcję i zwraca wynik modelowi. |
| **tool_use** | (Anthropic) `stop_reason` informujący, że model chce wywołać narzędzie |
| **tool_result** | Wynik wywołania narzędzia, odsyłany do modelu jako wiadomość |
| **Human-in-the-loop** | Wzorzec, w którym w trakcie przetwarzania AI angażujemy człowieka (tu: pytamy użytkownika) |
| **MCP (Model Context Protocol)** | Protokół łączenia modeli AI z narzędziami zewnętrznymi (serwer-klient). Nasze narzędzie clarification NIE jest MCP — jest lokalne. |
| **System prompt** | Instrukcja startowa dla modelu, definiująca jego zachowanie i rolę |
| **Barrel export** | Plik `index.ts`, który re-exportuje z modułu — upraszcza importy |
