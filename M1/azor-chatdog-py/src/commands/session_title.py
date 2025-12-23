from cli import console

def display_session_title(title: str | None, session_id: str):
    """
    Displays the title of the session.
    """
    if title:
        console.print_info(f"Session {session_id} title: {title}")
    else:
        console.print_info(f"Session {session_id} title: No title set")