import type { Assistant } from '../assistant/assistant.js';
import type { ILLMClient, Message, ConversationEntry, RolePlayingConfig, DialogTurnResult } from '../types/index.js';


export class RolePlayingDialog {
  private participants: Assistant[];
  private initialPrompt: string;
  private conversationLog: ConversationEntry[] = [];
  private llmClient: ILLMClient;
  private config: RolePlayingConfig;
  private currentTurn: number = 0;


  constructor(
    participants: Assistant[],
    initialPrompt: string,
    llmClient: ILLMClient,
    config: Partial<RolePlayingConfig> = {}
  ) {
    if (participants.length < 2) {
      throw new Error('Dialog requires at least 2 participants');
    }
    this.participants = participants;
    this.initialPrompt = initialPrompt;
    this.llmClient = llmClient;
    this.config = {
      maxTurns: config.maxTurns ?? 0, // 0 = unlimited
      maxOutputTokens: config.maxOutputTokens ?? 256,
    };
  }

    /**
   * Build history from perspective of given persona
   * Own messages = "model", others' messages = "user"
   */
    private buildHistoryForPersona(persona: Assistant): Message[] {
      const rawEntries: { role: 'user' | 'model'; text: string }[] = [];
  
      // Initial prompt jest zawsze "user" dla kazdej persony
      rawEntries.push({ role: 'user', text: this.initialPrompt });
  
      // Kazda wypowiedz z loga: wlasna = "model", cudza = "user"
      for (const entry of this.conversationLog) {
        const role = entry.assistantId === persona.id ? 'model' : 'user';
        const prefix = role === 'user' ? `[${entry.assistantName}]: ` : '';
        rawEntries.push({ role, text: prefix + entry.text });
      }
  
      // Merguj kolejne same-role wiadomosci (wymog Anthropic API - alternacja user/assistant)
      const merged: Message[] = [];
      for (const entry of rawEntries) {
        if (merged.length > 0 && merged[merged.length - 1].role === entry.role) {
          merged[merged.length - 1].parts[0].text += '\n\n' + entry.text;
        } else {
          merged.push({ role: entry.role, parts: [{ text: entry.text }] });
        }
      }
  
      // Upewnij sie ze ostatnia wiadomosc to "user" (wymagane przez Anthropic)
      if (merged.length > 0 && merged[merged.length - 1].role === 'model') {
        // Dodaj placeholder "user" message
        merged.push({ role: 'user', parts: [{ text: 'Kontynuuj.' }] });
      }
  
      return merged;
    }

    /**
   * Execute single turn of dialog
   * Returns result or throws on error
   */
  async executeTurn(): Promise<DialogTurnResult> {
    // Determine current participant (round-robin)
    const participantIndex = this.currentTurn % this.participants.length;
    const currentPersona = this.participants[participantIndex];

    // Check turn limit
    const isLastTurn = this.config.maxTurns > 0 &&
                       this.currentTurn >= this.config.maxTurns - 1;

    // Build history for this persona
    const history = this.buildHistoryForPersona(currentPersona);

    // Call LLM
    const response = await this.llmClient.generateContent(
      currentPersona.systemPrompt,
      history,
      this.config.maxOutputTokens
    );

    // Add to conversation log
    const entry: ConversationEntry = {
      assistantId: currentPersona.id,
      assistantName: currentPersona.name,
      text: response.text,
    };
    this.conversationLog.push(entry);

    const result: DialogTurnResult = {
      ...entry,
      turnNumber: this.currentTurn,
      isLastTurn,
    };

    this.currentTurn++;
    return result;
  }

  /**
   * Check if dialog has reached turn limit
   */
  hasReachedLimit(): boolean {
    return this.config.maxTurns > 0 && this.currentTurn >= this.config.maxTurns;
  }

  /**
   * Get current turn number
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }

  /**
   * Get all participants
   */
  getParticipants(): Assistant[] {
    return this.participants;
  }
}