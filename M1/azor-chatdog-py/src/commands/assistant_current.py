from session.session_manager import SessionManager
from session.chat_session import ChatSession
from cli import console

def display_current_assistant_command(manager: SessionManager):
    """
    Displays the current assistant for the current session.
    """
    chat_session: ChatSession = manager.get_current_session()
    console.print_help(f"Aktualny asystent: {chat_session.assistant.name}")