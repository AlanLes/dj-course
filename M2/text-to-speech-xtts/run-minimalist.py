from TTS.api import TTS
import torch
# Monkeypatch torch.load to allow loading custom classes (required for XTTS)
original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load


tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2",progress_bar=True).to("cpu")
FILE_PATH = "smpl-dragon.wav"
OUTPUT_WAV_PATH = "output-minimalist.wav"

text = "Hello darkness, my old friend,\nI've come to talk with you again,\nBecause a vision softly creeping,\nLeft its seeds while I was sleeping,\nAnd the vision that was planted in my brain\nStill remains"
# text = "Merhaba karanlık, eski dostum, Seninle tekrar konuşmaya geldim, Çünkü yavaşça sürünen bir görüntü, Uyurken tohumlarını bıraktı, Ve beynime ekilen görüntü Hâlâ duruyor"

tts.tts_to_file(
    text=text,
    file_path=OUTPUT_WAV_PATH,
    speaker_wav=FILE_PATH,
    language="en",
    speed=2.0
)

