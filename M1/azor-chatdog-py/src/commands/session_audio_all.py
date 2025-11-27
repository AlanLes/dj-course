from typing import List, Dict
from pathlib import Path
from cli import console
from audio.tts_engine import generate_audio
from audio.wav_utils import concatenate_wav

# Ścieżki do sampli głosu
AUDIO_DIR = Path(__file__).parent.parent / "audio"
SPEAKER_USER = AUDIO_DIR / "smpl-maria.wav"
SPEAKER_MODEL = AUDIO_DIR / "smpl-azor.wav"

def generate_audio_all_command(history: List[Dict], session_id: str):
    """
    Generuje plik audio z całej historii sesji.
    """
    if not history:
        console.print_error("Historia jest pusta. Nie ma czego przekształcić na audio.")
        return
    
    output_filenames = []
    console.print_info(f"Generowanie audio dla {len(history)} wiadomości...")
    
    for idx, message in enumerate(history):
        role = message.get("role")
        parts = message.get("parts", [])
        
        if not parts:
            continue
            
        text = parts[0].get("text", "")
        if not text:
            continue
        
        # Wybierz sample głosu na podstawie roli
        if role == "user":
            speaker = str(SPEAKER_USER)
        elif role == "model":
            speaker = str(SPEAKER_MODEL)
        else:
            continue  # pomiń nieznane role
        
        output_filename = f"{session_id}-{idx}.wav"
        console.print_info(f"[{idx+1}/{len(history)}] Generowanie: {role}...")
        
        success, error = generate_audio(text, output_filename, speaker_wav=speaker)
        if success:
            output_filenames.append(output_filename)
        else:
            console.print_error(f"Błąd podczas generowania audio: {error}")
            return
    
    # Połącz wszystkie pliki
    console.print_info("Łączenie plików audio...")
    success, error = concatenate_wav(output_filenames, f"{session_id}-all.wav")
    
    if success:
        console.print_info(f"Audio zapisane do: {session_id}-all.wav")
        # Opcjonalnie: usuń pliki tymczasowe
        for f in output_filenames:
            Path(f).unlink(missing_ok=True)
    else:
        console.print_error(f"Błąd podczas łączenia audio: {error}")