# Plan: Dodanie MCP Tools do AZØRA

## 📋 Cel zadania

Rozbudowa AZØRA o własny **MCP Server** z trzema narzędziami (tools):
1. **list_sessions** - listuje sesje/wątki w `~/.azor/*.json` wraz z datą aktualizacji
2. **get_session** - zwraca metadane + treść wybranej sesji
3. **delete_sessions** - usuwa wybrany wątek/wątki

**Test końcowy**: Prompt "usuń wątki z ostatniej doby" - agent ma zorkiestrować i wykonać całość.

---

## 🎓 Teoria: Co to jest MCP?

### Model Context Protocol (MCP)

MCP to **otwarty protokół** stworzony przez Anthropic, który standaryzuje sposób komunikacji między aplikacjami AI (jak Claude, Cursor) a zewnętrznymi źródłami danych i narzędziami.

**Analogia**: MCP jest jak "USB dla AI" - jeden standard, który pozwala podłączyć różne narzędzia do różnych modeli AI.

### Architektura MCP

```
┌─────────────────┐     MCP Protocol      ┌─────────────────┐
│   MCP Client    │ ◄──────────────────► │   MCP Server    │
│  (Claude/Cursor)│                       │  (Twój kod)     │
└─────────────────┘                       └─────────────────┘
        │                                         │
        │                                         │
   Wysyła żądania                          Udostępnia:
   do narzędzi                             - Tools (narzędzia)
                                           - Resources (dane)
                                           - Prompts (szablony)
```

### Trzy główne koncepty MCP

| Koncept | Opis | Przykład |
|---------|------|----------|
| **Tools** | Funkcje, które model może wywołać | `delete_sessions(ids=[...])` |
| **Resources** | Dane do odczytu | `config://settings` |
| **Prompts** | Szablony promptów | `review_code(code="...")` |

W tym zadaniu skupiamy się na **Tools**.

### Transport

MCP obsługuje różne metody transportu:
- **stdio** - standardowe wejście/wyjście (domyślne, używane przez Cursor)
- **streamable-http** - HTTP z obsługą streamingu
- **SSE** - Server-Sent Events

Dla integracji z Cursor używamy **stdio**.

---

## 🛠️ Krok 1: Instalacja zależności

### 1.1 Dodaj pakiet MCP do requirements.txt

Otwórz `requirements.txt` i dodaj na końcu:

```
mcp>=1.0.0
```

### 1.2 Zainstaluj zależności

```bash
cd /Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py
source .venv/bin/activate
pip install mcp
```

### 1.3 Weryfikacja instalacji

```bash
python -c "from mcp.server.fastmcp import FastMCP; print('MCP zainstalowane poprawnie!')"
```

---

## 🛠️ Krok 2: Stworzenie MCP Server

### 2.1 Utwórz nowy plik `src/mcp_server.py`

To będzie główny plik serwera MCP. Stwórz go z następującą zawartością:

```python
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

# Konfiguracja - ta sama co w AZØRZE
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
```

### 2.2 Wyjaśnienie kodu

#### Dekorator `@mcp.tool()`

```python
@mcp.tool()
def list_sessions() -> str:
    """Docstring staje się opisem narzędzia dla modelu AI."""
    ...
```

- **Dekorator** rejestruje funkcję jako narzędzie MCP
- **Docstring** jest automatycznie używany jako opis narzędzia
- **Type hints** (np. `session_id: str`) definiują schemat parametrów
- **Return type** powinien być `str` (JSON) dla łatwej interpretacji przez model

#### Zwracanie JSON

Model AI lepiej rozumie strukturyzowane dane. Dlatego wszystkie toole zwracają JSON:

```python
return json.dumps({
    "status": "success",
    "data": ...
}, ensure_ascii=False, indent=2)
```

- `ensure_ascii=False` - zachowuje polskie znaki
- `indent=2` - czytelne formatowanie

---

## 🛠️ Krok 3: Testowanie lokalne

### 3.1 Test bezpośredni (Python)

Najpierw przetestuj, czy kod działa poprawnie:

```bash
cd /Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py
source .venv/bin/activate

# Uruchom Pythona interaktywnie
python
```

W interpreterze Python:

```python
# Importuj i przetestuj funkcje
import sys
sys.path.insert(0, 'src')

from mcp_server import list_sessions, get_session, delete_sessions

# Test 1: Listowanie sesji
print(list_sessions())

# Test 2: Pobranie konkretnej sesji (użyj ID z listy)
# print(get_session("twoje-session-id"))

# Test 3: Usunięcie sesji (OSTROŻNIE!)
# print(delete_sessions(["session-id-do-usuniecia"]))
```

### 3.2 Test z MCP Inspector

MCP Inspector to oficjalne narzędzie do testowania serwerów MCP.

```bash
# Zainstaluj/uruchom inspector (wymaga Node.js)
npx @modelcontextprotocol/inspector python src/mcp_server.py
```

**Co zobaczysz:**
1. Otwórz URL wyświetlony w terminalu (zazwyczaj http://localhost:5173)
2. W interfejsie zobaczysz listę dostępnych narzędzi
3. Możesz wywołać każde narzędzie i zobaczyć wynik

### 3.3 Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| `ModuleNotFoundError: No module named 'mcp'` | `pip install mcp` |
| `FileNotFoundError: ~/.azor/` | Uruchom AZØRA raz, aby utworzył katalog |
| Inspector nie łączy się | Sprawdź czy `python src/mcp_server.py` działa bez błędów |

---

## 🛠️ Krok 4: Integracja z Cursor

### 4.1 Konfiguracja MCP w Cursor

Cursor szuka konfiguracji MCP w pliku `~/.cursor/mcp.json` (globalnie) lub `.cursor/mcp.json` (w projekcie).

Utwórz/edytuj plik `.cursor/mcp.json` w projekcie:

```json
{
  "mcpServers": {
    "azor-sessions": {
      "command": "python",
      "args": ["src/mcp_server.py"],
      "cwd": "/Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py",
      "env": {
        "PYTHONPATH": "/Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py/src"
      }
    }
  }
}
```

**Alternatywnie** - użyj pełnej ścieżki do Pythona z venv:

```json
{
  "mcpServers": {
    "azor-sessions": {
      "command": "/Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py/.venv/bin/python",
      "args": ["src/mcp_server.py"],
      "cwd": "/Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py"
    }
  }
}
```

### 4.2 Restart Cursor

Po dodaniu konfiguracji:
1. Zamknij Cursor całkowicie
2. Otwórz ponownie
3. Cursor automatycznie uruchomi serwer MCP

### 4.3 Weryfikacja

W Cursor, otwórz czat i wpisz:
```
Jakie masz dostępne narzędzia MCP?
```

Powinieneś zobaczyć `list_sessions`, `get_session`, `delete_sessions`.

---

## 🛠️ Krok 5: Test końcowy

### 5.1 Przygotowanie danych testowych

Upewnij się, że masz kilka sesji w `~/.azor/`:

```bash
ls -la ~/.azor/*.json
```

Jeśli nie masz sesji, uruchom AZØRA i przeprowadź krótką rozmowę:

```bash
cd /Users/alanleszczuk/projects/DJ/M1/azor-chatdog-py
source .venv/bin/activate
python src/run.py
```

### 5.2 Test scenariusza

W Cursor, wpisz prompt:

```
Usuń wątki z ostatniej doby
```

**Oczekiwane zachowanie agenta:**

1. **Wywołanie `list_sessions`** - agent pobierze listę wszystkich sesji z datami
2. **Analiza dat** - agent zidentyfikuje sesje z ostatnich 24h
3. **Wywołanie `delete_sessions`** - agent usunie zidentyfikowane sesje
4. **Raport** - agent poinformuje o wyniku operacji

### 5.3 Inne scenariusze testowe

```
# Listowanie
Pokaż mi wszystkie sesje AZØRA

# Szczegóły
Pokaż zawartość sesji [wklej-id-sesji]

# Usuwanie warunkowe
Usuń sesje, które mają mniej niż 5 wiadomości

# Usuwanie po tytule
Usuń sesje bez tytułu
```

---

## 📁 Struktura plików po zmianach

```
M1/azor-chatdog-py/
├── .cursor/
│   └── mcp.json          # ← NOWY: konfiguracja MCP dla Cursor
├── src/
│   ├── mcp_server.py     # ← NOWY: serwer MCP z narzędziami
│   ├── run.py
│   ├── chat.py
│   └── ...
├── requirements.txt      # ← ZMODYFIKOWANY: dodane mcp>=1.0.0
└── ...
```

---

## 🔍 Debugowanie

### Logi serwera MCP

Aby zobaczyć co robi serwer:

```bash
# Uruchom serwer ręcznie z logowaniem
python src/mcp_server.py 2>&1 | tee mcp_debug.log
```

### Sprawdzenie czy Cursor widzi serwer

W Cursor Settings → Features → MCP powinieneś zobaczyć status serwera.

### Typowe problemy

| Symptom | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| Cursor nie widzi narzędzi | Błędna ścieżka w mcp.json | Sprawdź `cwd` i `command` |
| Błąd importu | Brak PYTHONPATH | Dodaj `env.PYTHONPATH` w mcp.json |
| Serwer nie startuje | Błąd w kodzie | Uruchom `python src/mcp_server.py` ręcznie |

---

## ✅ Checklist

- [ ] Zainstalowano pakiet `mcp` (`pip install mcp`)
- [ ] Utworzono `src/mcp_server.py` z trzema narzędziami
- [ ] Przetestowano lokalnie w Pythonie
- [ ] Przetestowano z MCP Inspector
- [ ] Utworzono `.cursor/mcp.json`
- [ ] Zrestartowano Cursor
- [ ] Cursor widzi narzędzia MCP
- [ ] Test "usuń wątki z ostatniej doby" działa

---

## 📚 Materiały dodatkowe

- [MCP Python SDK - GitHub](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

---

## 🎯 Podsumowanie

W tym zadaniu nauczyłeś się:

1. **Czym jest MCP** - protokół łączący AI z zewnętrznymi narzędziami
2. **Jak stworzyć MCP Server** - używając FastMCP i dekoratora `@mcp.tool()`
3. **Jak testować** - lokalnie i z MCP Inspector
4. **Jak zintegrować z Cursor** - przez plik `mcp.json`
5. **Jak projektować narzędzia** - zwracanie JSON, dobre docstringi, obsługa błędów

MCP to potężny mechanizm, który pozwala rozszerzać możliwości modeli AI o dowolne funkcjonalności - od zarządzania plikami, przez API, po kontrolę urządzeń IoT.
