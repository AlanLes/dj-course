from tokenizers import Tokenizer
from corpora import get_corpus_file
from pathlib import Path
from collections import defaultdict

TEXTS = {
    "pan-tadeusz": {
        "title": "Pan Tadeusz",
        "corpus_name": "WOLNELEKTURY",
        "file_pattern": "pan-tadeusz-ksiega-*.txt"
    },
    "pickwick-papers": {
        "title": "The Pickwick Papers",
        "corpus_name": "MINI",
        "file_pattern": "the-pickwick-papers-gutenberg.txt"
    },
    "chopin": {
        "title": "Fryderyk Chopin",
        "corpus_name": "MINI",
        "file_pattern": "fryderyk-chopin-wikipedia.txt"
    },
}

TOKENIZERS = {
    "bpe": "tokenizers/bpe_tokenizer.json",
    "bielik-v1": "tokenizers/bielik-v1-tokenizer.json",
    "bielik-v2": "tokenizers/bielik-v2-tokenizer.json",
    "bielik-v3": "tokenizers/bielik-v3-tokenizer.json",
    "custom-bpe-py": "tokenizers/custom_bpe_tokenizer-py.json",
    "alibaba": "tokenizers/Alibaba-NLP-Tongyi-DeepResearch-30B-A3B.json",
    "polish-gpt2-xl": "tokenizers/sdadas-polish-gpt2-xl.json",
    "polish-wikipedia-model": "tokenizers/Pyro-X2-polish_wikipedia_model.json",
    "tokenizer-all-corpora": "tokenizers/tokenizer-all-corpora.json",
    "tokenizer-nkjp": "tokenizers/tokenizer-nkjp.json",
    "tokenizer-pan-tadeusz": "tokenizers/tokenizer-pan-tadeusz.json",
    "tokenizer-wolnelektury": "tokenizers/tokenizer-wolnelektury.json",
}

def print_ascii_chart(title, data, max_width=60):
    """
    Rysuje wykres słupkowy ASCII.

    Args:
        title: Tytuł wykresu
        data: Słownik z danymi {etykieta: wartość}
        max_width: Maksymalna szerokość słupka w znakach
    """
    print(f"\n{'='*80}")
    print(f" {title}")
    print(f"{'='*80}")

    if not data:
        print("Brak danych do wyświetlenia.")
        return

    # Znalezienie maksymalnej wartości
    max_value = max(data.values()) if data else 1

    # Wyświetlenie wykresu (posortowane od najmniejszej do największej wartości)
    for label, value in sorted(data.items(), key=lambda x: x[1]):
        # Długość słupka proporcjonalna do wartości
        bar_length = int((value / max_value) * max_width) if max_value > 0 else 0
        bar = "█" * bar_length

        # Format: etykieta | słupek | liczba
        print(f" {label:<25} | {bar:<{max_width}} | Liczba tokenów: {value:>8,}")

    print(f"{'='*80}\n")

# Słownik do zbierania statystyk
statistics = defaultdict(dict)

for text, text_data in TEXTS.items():
    print(f"Processing text: {text_data['title']}")
    tokenizer_stats = {}

    for tokenizer_name, tokenizer_path in TOKENIZERS.items():
        if not Path(tokenizer_path).exists():
            print(f"⚠️  Skipping {tokenizer_name}: File not found at {tokenizer_path}")
            continue

        print(f"Processing tokenizer: {tokenizer_name}")
        print(f"Tokenizer path: {tokenizer_path}")
        tokenizer = Tokenizer.from_file(tokenizer_path)

        source_txt = ""
        with open(get_corpus_file(text_data["corpus_name"], text_data["file_pattern"])[0], 'r', encoding='utf-8') as f:
            source_txt = f.read()

        encoded = tokenizer.encode(source_txt)
        token_count = len(encoded.ids)
        tokenizer_stats[tokenizer_name] = token_count

        file_name = f"logs/tokenized-{text_data['title']}-{tokenizer_name}.log"

        # Create logs directory if it doesn't exist
        Path("logs").mkdir(parents=True, exist_ok=True)

        with open(file_name, 'w', encoding='utf-8') as f:
            f.write(f"Liczba tokenów: {token_count}\n")
            f.write(f"Tokenizer: {tokenizer_name}\n")
            print(f"Tokenizer: {tokenizer_name}")
            print(f"Liczba tokenów: {token_count}")

    # Wyświetlenie wykresu dla danego tekstu
    statistics[text_data['title']] = tokenizer_stats
    print_ascii_chart(f"Wyniki tokenizacji: {text_data['title']}", tokenizer_stats)