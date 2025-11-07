"""
Konfiguracja dla porównania parametrów treningu Word2Vec CBOW.

INSTRUKCJA UŻYCIA:
1. Zmień CORPUS_NAME na żądany korpus ("PAN_TADEUSZ", "WOLNELEKTURY", "NKJP", "ALL")
2. Zmień TOKENIZER_FILE na żądany tokenizer
3. Dostosuj TEST_WORDS do własnych potrzeb
4. Zmodyfikuj PARAMETER_GRID aby testować różne zakresy parametrów
5. Uruchom: python run_comparison.py
"""

# ============================================================================
# KONFIGURACJA KORPUSU I TOKENIZERA (GŁÓWNE USTAWIENIA DO ZMIANY)
# ============================================================================

# Wybór korpusu - dostępne opcje: "PAN_TADEUSZ", "WOLNELEKTURY", "NKJP", "ALL"
CORPUS_NAME = "ALL"

# Ścieżka do tokenizera
TOKENIZER_FILE = "../tokenizer/tokenizers/sdadas-polish-gpt2-xl.json"

# Alternatywne opcje tokenizera (odkomentuj żądaną):
# TOKENIZER_FILE = "../tokenizer/tokenizers/custom_bpe_tokenizer-py.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v3-tokenizer.json"

# ============================================================================
# SŁOWA TESTOWE DO WNIOSKOWANIA
# ============================================================================

TEST_WORDS = [
    # "zamek",
    # "koń",
    "pies",
    "rower",
    "auto",
    # "piec",
    "worek",
    # "boks"
]

# ============================================================================
# SIATKA PARAMETRÓW DO TESTOWANIA
# ============================================================================

PARAMETER_GRID = {
    # "VECTOR_LENGTH": [10, 20, 50],
    # "WINDOW_SIZE": [3, 6, 10],
    # "MIN_COUNT": [1, 2, 5],
    # "WORKERS": [2, 4],
    # "EPOCHS": [10, 20, 30],
    # "SAMPLE_RATE": [1e-3, 1e-2],
    "VECTOR_LENGTH": [10, 50],
    "WINDOW_SIZE": [3, 18],
    "MIN_COUNT": [1, 5],
    "WORKERS": [2],
    "EPOCHS": [10, 30],
    "SAMPLE_RATE": [1e-3, 1e-2],
}

# ============================================================================
# ŚCIEŻKI PLIKÓW WYJŚCIOWYCH
# ============================================================================

OUTPUT_RESULTS_FILE = "comparison_results.json"
OUTPUT_REPORT_FILE = "comparison_report.txt"

# ============================================================================
# INNE USTAWIENIA
# ============================================================================

# Liczba najbardziej podobnych tokenów do pokazania dla każdego słowa
TOP_N_SIMILAR = 3

# Tryb algorytmu: 0 dla CBOW, 1 dla Skip-gram
SG_MODE = 0

