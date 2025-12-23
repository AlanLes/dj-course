from assistant import Assistant, AssistantRegistry
from cli import console
import uuid

def create_assistant_command():
    """
    Creates a new assistant with a name and system prompt.
    """
    name = input("Podaj nazwę asystenta: ")
    system_prompt = input("Podaj system prompt asystenta: ")
    assistant = Assistant(id=name.lower().replace(" ", "_"), name=name, system_prompt=system_prompt)
    AssistantRegistry.register(assistant)
    console.print_help(f"Asystent utworzony: {assistant.name}")
    return True