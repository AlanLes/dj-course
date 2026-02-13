import { Assistant } from "./assistant.js";
import { createAzaAssistant } from "./aza.js";
import { createReksioAssistant } from "./reksio.js";
import { createAzorAssistant } from "./azor.js";

export class AssistantRegistry {
    private static assistants: Map<string, Assistant> = new Map();

    public static register(assistant: Assistant): void {
        this.assistants.set(assistant.id, assistant);
    }

    public static get(id: string): Assistant | undefined {
        return this.assistants.get(id);
    }

    public static list(): Assistant[] {
        return Array.from(this.assistants.values());
    }
    
    public static has(id: string): boolean {
        return this.assistants.has(id);
    }

    public static registerBuiltinAssistants(): void {
        this.register(createAzaAssistant());
        this.register(createReksioAssistant());
        this.register(createAzorAssistant());
    }
}