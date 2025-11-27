"""
Narzędzia do manipulacji plikami WAV.
"""
import wave
from pathlib import Path
from typing import List


def concatenate_wav(input_files: List[str], output_file: str) -> tuple[bool, str | None]:
    """
    Łączy wiele plików WAV w jeden plik wynikowy.
    
    Wszystkie pliki wejściowe muszą mieć te same parametry audio
    (sample rate, liczba kanałów, sample width).
    
    Args:
        input_files: Lista ścieżek do plików WAV do połączenia (w kolejności)
        output_file: Ścieżka do pliku wynikowego
        
    Returns:
        tuple: (sukces: bool, komunikat_błędu: str | None)
    """
    if not input_files:
        return False, "Lista plików wejściowych jest pusta"
    
    try:
        # Otwórz pierwszy plik, aby pobrać parametry referencyjne
        with wave.open(input_files[0], 'rb') as first_wav:
            params = first_wav.getparams()
            # params zawiera: (nchannels, sampwidth, framerate, nframes, comptype, compname)
        
        # Otwórz plik wyjściowy z tymi samymi parametrami
        with wave.open(output_file, 'wb') as output_wav:
            output_wav.setparams(params)
            
            # Iteruj po wszystkich plikach wejściowych i dopisuj dane audio
            for input_file in input_files:
                with wave.open(input_file, 'rb') as input_wav:
                    # Sprawdź zgodność parametrów
                    input_params = input_wav.getparams()
                    if (input_params.nchannels != params.nchannels or
                        input_params.sampwidth != params.sampwidth or
                        input_params.framerate != params.framerate):
                        return False, (
                            f"Niezgodne parametry audio w pliku {input_file}. "
                            f"Oczekiwano: {params.framerate}Hz, {params.nchannels}ch, {params.sampwidth*8}bit. "
                            f"Otrzymano: {input_params.framerate}Hz, {input_params.nchannels}ch, {input_params.sampwidth*8}bit."
                        )
                    
                    # Odczytaj wszystkie klatki audio i zapisz do pliku wyjściowego
                    frames = input_wav.readframes(input_wav.getnframes())
                    output_wav.writeframes(frames)
        
        return True, None
        
    except FileNotFoundError as e:
        return False, f"Nie znaleziono pliku: {e.filename}"
    except wave.Error as e:
        return False, f"Błąd przetwarzania WAV: {str(e)}"
    except Exception as e:
        return False, f"Nieoczekiwany błąd: {str(e)}"