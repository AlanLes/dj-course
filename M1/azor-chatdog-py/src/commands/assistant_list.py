from assistant import AssistantRegistry
from cli import console

def list_assistants_command():
    """Displays a formatted list of available assistants."""
    assistants = AssistantRegistry.list_all()
    if assistants:
        console.print_help("\n--- Dostępne asystenci (ID) ---")
        for assistant in assistants:
            console.print_help(f"- ID: {assistant.id} ({assistant.name}, System role: {assistant.system_prompt[:100]}...)")
        console.print_help("------------------------------------")
    else:
        console.print_help("\nBrak dostępnych asystentów.")