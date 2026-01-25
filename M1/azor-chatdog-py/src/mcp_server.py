"""
MCP Server dla AZØRA - udostępnia narzędzia do zarządzania sesjami czatu.

Uruchomienie:
    python src/mcp_server.py

Testowanie:
    npx @modelcontextprotocol/inspector python src/mcp_server.py
"""

import os
import json
from datetime import datetime
from typing import Optional
from mcp.server.fastmcp import FastMCP

LOG_DIR = os.path.join(os.path.expanduser('~'), '.azor')

# Inicjalizacja serwera MCP
mcp = FastMCP(
    name="Azor Session Manager",
    version="1.0.0"
)


def _get_session_files() -> list[str]:
    """Pomocnicza funkcja - zwraca listę plików sesji."""
    if not os.path.exists(LOG_DIR):
        return []
    
    files = os.listdir(LOG_DIR)
    return [f for f in files if f.endswith('-log.json')]


def _load_session_data(session_id: str) -> dict | None:
    """Pomocnicza funkcja - wczytuje dane sesji z pliku."""
    log_path = os.path.join(LOG_DIR, f"{session_id}-log.json")
    
    if not os.path.exists(log_path):
        return None
    
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


# ============================================================
# TOOL 1: list_sessions - Listowanie sesji
# ============================================================

@mcp.tool()
def list_sessions() -> str:
    """
    Listuje wszystkie sesje/wątki czatu AZØRA.
    
    Zwraca listę sesji z metadanymi:
    - session_id: unikalny identyfikator sesji
    - title: tytuł sesji (jeśli ustawiony)
    - messages_count: liczba wiadomości w sesji
    - last_activity: data ostatniej aktywności
    - file_modified: data modyfikacji pliku

    Returns:
        JSON z listą sesji lub komunikat o braku sesji.
    """
    session_files = _get_session_files()
    
    if not session_files:
        return json.dumps({
            "status": "empty",
            "message": "Brak zapisanych sesji w ~/.azor/",
            "sessions": []
        }, ensure_ascii=False)

    sessions = []

    for filename in session_files:
        session_id = filename.replace('-log.json', '')
        file_path = os.path.join(LOG_DIR, filename)
        
        # Pobierz datę modyfikacji pliku
        try:
            file_mtime = os.path.getmtime(file_path)
            file_modified = datetime.fromtimestamp(file_mtime).isoformat()
        except OSError:
            file_modified = None
        
        # Wczytaj dane sesji
        data = _load_session_data(session_id)
        
        if data:
            history = data.get('history', [])
            last_msg = history[-1] if history else {}
            last_activity = last_msg.get('timestamp', None)
            
            sessions.append({
                "session_id": session_id,
                "title": data.get('title'),
                "model": data.get('model'),
                "messages_count": len(history),
                "last_activity": last_activity,
                "file_modified": file_modified
            })
        else:
            sessions.append({
                "session_id": session_id,
                "error": "Nie można odczytać pliku sesji",
                "file_modified": file_modified
            })
    
    # Sortuj po dacie modyfikacji (najnowsze pierwsze)
    sessions.sort(
        key=lambda x: x.get('file_modified') or '',
        reverse=True
    )
    
    return json.dumps({
        "status": "success",
        "count": len(sessions),
        "sessions": sessions
    }, ensure_ascii=False, indent=2)


# ============================================================
# TOOL 2: get_session - Pobieranie zawartości sesji
# ============================================================

@mcp.tool()
def get_session(session_id: str) -> str:
    """
    Zwraca pełne metadane i zawartość wybranej sesji czatu.
    
    Args:
        session_id: Identyfikator sesji do pobrania (UUID).
    
    Returns:
        JSON z metadanymi sesji i pełną historią konwersacji,
        lub komunikat o błędzie jeśli sesja nie istnieje.
    """
    data = _load_session_data(session_id)
    
    if data is None:
        return json.dumps({
            "status": "error",
            "message": f"Sesja o ID '{session_id}' nie istnieje lub nie można jej odczytać."
        }, ensure_ascii=False)
    
    # Pobierz datę modyfikacji pliku
    file_path = os.path.join(LOG_DIR, f"{session_id}-log.json")
    try:
        file_mtime = os.path.getmtime(file_path)
        file_modified = datetime.fromtimestamp(file_mtime).isoformat()
    except OSError:
        file_modified = None
    
    return json.dumps({
        "status": "success",
        "session_id": session_id,
        "title": data.get('title'),
        "model": data.get('model'),
        "system_role": data.get('system_role'),
        "assistant_id": data.get('assistant_id'),
        "messages_count": len(data.get('history', [])),
        "file_modified": file_modified,
        "history": data.get('history', [])
    }, ensure_ascii=False, indent=2)

# ============================================================
# TOOL 3: delete_sessions - Usuwanie sesji
# ============================================================

@mcp.tool()
def delete_sessions(session_ids: list[str]) -> str:
    """
    Usuwa wybrane sesje/wątki czatu AZØRA.
    
    Args:
        session_ids: Lista identyfikatorów sesji do usunięcia.
    
    Returns:
        JSON z podsumowaniem operacji:
        - deleted: lista pomyślnie usuniętych sesji
        - failed: lista sesji, których nie udało się usunąć (z powodami)
    """
    if not session_ids:
        return json.dumps({
            "status": "error",
            "message": "Nie podano żadnych ID sesji do usunięcia."
        }, ensure_ascii=False)
    
    deleted = []
    failed = []
    
    for session_id in session_ids:
        file_path = os.path.join(LOG_DIR, f"{session_id}-log.json")
        
        if not os.path.exists(file_path):
            failed.append({
                "session_id": session_id,
                "reason": "Plik sesji nie istnieje"
            })
            continue
        
        try:
            os.remove(file_path)
            deleted.append(session_id)
        except OSError as e:
            failed.append({
                "session_id": session_id,
                "reason": str(e)
            })
    
    return json.dumps({
        "status": "success" if deleted else "error",
        "deleted_count": len(deleted),
        "failed_count": len(failed),
        "deleted": deleted,
        "failed": failed
    }, ensure_ascii=False, indent=2)


# ============================================================
# Uruchomienie serwera
# ============================================================

if __name__ == "__main__":
    # Domyślnie używamy stdio (wymagane przez Cursor/Claude)
    mcp.run()