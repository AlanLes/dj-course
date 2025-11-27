import torch
from pathlib import Path

# Monkeypatch torch.load - wymagany przez XTTS do ładowania custom classes
original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load

from TTS.api import TTS

# Ścieżka do próbki głosu (względna do tego pliku)
SPEAKER_WAV = Path(__file__).parent / "smpl-alan.wav"

# Model ładowany przy imporcie (eager loading)
# Przy pierwszym uruchomieniu model zostanie pobrany (~2GB)
print("Ładowanie modelu TTS...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
print("Model TTS załadowany.")


def generate_audio(text: str, output_path: str, speaker_wav: str | None = None):
    """
    Generuje plik .wav z podanego tekstu.
    
    Args:
        text: Tekst do syntezy mowy
        output_path: Ścieżka do pliku wyjściowego .wav
        
    Returns:
        tuple: (sukces: bool, komunikat_błędu: str | None)
    """
    try:
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=speaker_wav if speaker_wav else str(SPEAKER_WAV),
            language="pl"
        )
        return True, None
    except Exception as e:
        return False, str(e)