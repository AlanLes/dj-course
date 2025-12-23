from cli import console
from session.chat_session import ChatSession

def rename_session(session: ChatSession, new_title: str) -> bool:
    """
    Renames the session.
    """
    if session.set_title(new_title):
        session.save_to_file()
        console.print_info(f"Session {session.session_id} renamed to: {new_title}")
        return True
    else:
        console.print_error("Failed to rename the session")
        return False