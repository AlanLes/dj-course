from assistant import AssistantRegistry
from session.session_manager import SessionManager
from cli import console

def switch_assistant_command(manager, assistant_id: str):
    """Switches the assistant for the current session."""
    success = manager.switch_assistant(assistant_id)
    return success

