from typing import List, Dict
from cli import console
from audio import generate_audio


def get_last_assistant_response(history: List[Dict]) -> str | None:
    """
    Pobiera tekst ostatniej odpowiedzi asystenta z historii.
    
    Args:
        history: Lista wiadomości w formacie {"role": "user|model", "parts": [{"text": "..."}]}
        
    Returns:
        Tekst ostatniej odpowiedzi lub None jeśli brak
    """
    # Iterujemy od końca, szukając pierwszej wiadomości z role="model"
    for message in reversed(history):
        if message.get("role") == "model":
            parts = message.get("parts", [])
            if parts:
                return parts[0].get("text", "")
    return None


def generate_audio_command(history: List[Dict], session_id: str):
    """
    Generuje plik audio z ostatniej odpowiedzi asystenta.
    
    Args:
        history: Historia konwersacji
        session_id: ID sesji (używane do nazwy pliku)
    """
    if not history:
        console.print_error("Historia jest pusta. Nie ma czego przekształcić na audio.")
        return
    
    # Pobierz ostatnią odpowiedź asystenta
    last_response = get_last_assistant_response(history)
    
    if not last_response:
        console.print_error("Nie znaleziono odpowiedzi asystenta w historii.")
        return
    
    # Nazwa pliku wyjściowego
    output_filename = f"{session_id}-audio.wav"
    
    console.print_info(f"Generowanie audio... (to może chwilę potrwać)")
    
    # Generuj audio
    success, error = generate_audio(last_response, output_filename)
    
    if success:
        console.print_info(f"Audio zapisane do: {output_filename}")
    else:
        console.print_error(f"Błąd generowania audio: {error}")