import os

# Konfiguracja korpusu i tokenizera
CORPUS_NAME = "ALL"
TOKENIZER_FILE = os.path.join(os.path.dirname(__file__), "..", "tokenizer", "tokenizers", "bielik-v3-tokenizer.json")

# Zdania testowe do wnioskowania
TEST_SENTENCES = [
    "Wczoraj jechałem na rowerze",
    "Mój syn jest chory i ma gorączkę",
    # "Kocham moją żonę i uważam, że bardzo wiele dla mnie robi"
]

# Siatka parametrów do przetestowania dla Doc2Vec
PARAMETER_GRID = {
    # "vector_length": [10, 20, 50],
    # "window_size": [3, 6, 10],
    # "min_count": [1, 4],
    # "workers": [4],  # Stała wartość
    # "epochs": [10, 20, 30],
    # "dm_mode": [0, 1]  # 0=DBOW, 1=DM
    "vector_length": [10, 50],
    "window_size": [3, 18],
    "min_count": [1, 5],
    "workers": [2],  # Stała wartość
    "epochs": [10, 30],
    "dm_mode": [0]  # 0=DBOW, 1=DM
}

# Pliki wyjściowe
OUTPUT_RESULTS_FILE = "comparison_results_doc2vec.json"
OUTPUT_REPORT_FILE = "comparison_report_doc2vec.txt"

# Tymczasowe pliki dla modelu i mapy zdań podczas każdej iteracji
TEMP_MODEL_FILE = "temp_doc2vec_model.model"
TEMP_SENTENCE_MAP = "temp_doc2vec_sentence_map.json"
