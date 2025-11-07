import numpy as np
import logging
from gensim.models import Word2Vec
from tokenizers import Tokenizer

# Ustawienie logowania dla gensim
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

# --- KONFIGURACJA ŚCIEŻEK ---
# WAŻNE: Te ścieżki muszą wskazywać na pliki wygenerowane przez train_cbow.py

# TOKENIZER_FILE = "../tokenizer/tokenizers/custom_bpe_tokenizer-py.json"
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v3-tokenizer.json"

OUTPUT_MODEL_FILE = "embedding_word2vec_cbow_model.model"

# --- ŁADOWANIE TOKENIZERA I MODELU ---

print(f"Ładowanie tokenizera z pliku: {TOKENIZER_FILE}")
try:
    tokenizer = Tokenizer.from_file(TOKENIZER_FILE)
except FileNotFoundError:
    print(f"BŁĄD: Nie znaleziono pliku '{TOKENIZER_FILE}'. Upewnij się, że plik istnieje.")
    raise

print(f"Ładowanie modelu Word2Vec z pliku: {OUTPUT_MODEL_FILE}")
try:
    model = Word2Vec.load(OUTPUT_MODEL_FILE)
    print(f"Model załadowany pomyślnie. Słownik zawiera {len(model.wv)} tokenów.")
except FileNotFoundError:
    print(f"BŁĄD: Nie znaleziono pliku '{OUTPUT_MODEL_FILE}'.")
    print("Najpierw uruchom skrypt train_cbow.py aby wytrenować model.")
    raise

# --- FUNKCJA: OBLICZANIE WEKTORA DLA CAŁEGO SŁOWA ---

def get_word_vector_and_similar(word: str, tokenizer: Tokenizer, model: Word2Vec, topn: int = 20):
    """
    Oblicza wektor dla całego słowa poprzez:
    1. Tokenizację słowa na tokeny podwyrazowe (BPE)
    2. Pobranie wektorów dla każdego tokenu z modelu
    3. Uśrednienie tych wektorów
    4. Znalezienie najbardziej podobnych tokenów w przestrzeni embeddingowej
    
    Args:
        word: słowo do przetworzenia
        tokenizer: wytrenowany tokenizer BPE
        model: wytrenowany model Word2Vec
        topn: ile najbardziej podobnych tokenów zwrócić
        
    Returns:
        (word_vector, similar_tokens) - wektor słowa i lista podobnych tokenów
        lub (None, None) jeśli słowo nie może być przetworzone
    """
    # Tokenizacja słowa na tokeny podwyrazowe
    # Używamy .encode(), aby otoczyć słowo spacjami, co imituje kontekst w zdaniu
    # Ważne: tokenizator BPE/SentencePiece musi widzieć spację, by dodać prefiks '_'
    encoding = tokenizer.encode(" " + word + " ") 
    word_tokens = [t.strip() for t in encoding.tokens if t.strip()] # Usuń puste tokeny
    
    # Usuwamy tokeny początku/końca sekwencji, jeśli zostały dodane przez tokenizator
    if word_tokens and word_tokens[0] in ['[CLS]', '<s>', '<s>', 'Ġ']:
        word_tokens = word_tokens[1:]
    if word_tokens and word_tokens[-1] in ['[SEP]', '</s>', '</s>']:
        word_tokens = word_tokens[:-1]

    valid_vectors = []
    missing_tokens = []
    
    # 1. Zbieranie wektorów dla każdego tokenu
    for token in word_tokens:
        if token in model.wv:
            # Użycie tokenu ze spacją (np. '_ryż') lub bez (np. 'szlach')
            valid_vectors.append(model.wv[token])
        else:
            # W tym miejscu token może być zbyt rzadki i pominięty przez MIN_COUNT
            missing_tokens.append(token)

    if not valid_vectors:
        # Kod do obsługi, gdy żaden token nie ma wektora
        if missing_tokens:
            print(f"BŁĄD: Żaden z tokenów składowych ('{word_tokens}') nie znajduje się w słowniku.")
            print(f"       Tokeny mogły być zbyt rzadkie (MIN_COUNT w treningu).")
        else:
            print(f"BŁĄD: Słowo '{word}' nie zostało przetworzone na wektory (sprawdź tokenizację).")
        return None, None

    # 2. Uśrednianie wektorów
    # Wektor dla całego słowa to średnia wektorów jego tokenów składowych
    word_vector = np.mean(valid_vectors, axis=0)

    # 3. Znalezienie najbardziej podobnych tokenów
    similar_words = model.wv.most_similar(
        positive=[word_vector],
        topn=topn
    )
    
    return word_vector, similar_words

# --- WERYFIKACJA: Szukanie podobieństw dla całych SŁÓW ---

print("\n--- Weryfikacja: Szukanie podobieństw dla całych SŁÓW (uśrednianie wektorów tokenów) ---")

# Przykłady słów do testowania
# UWAGA: Możesz zmienić te słowa na dowolne inne
words_to_test = ['wojsko', 'szlachta', 'choroba', 'król', 'dziecko', 'kobieta', 'tokenizer'] 

for word in words_to_test:
    word_vector, similar_tokens = get_word_vector_and_similar(word, tokenizer, model, topn=10)
    
    if word_vector is not None:
        print(f"\n10 tokenów najbardziej podobnych do SŁOWA '{word}' (uśrednione wektory tokenów {tokenizer.encode(word).tokens}):")
        # Wyświetlanie wektora (pierwsze 5 elementów)
        print(f"  > Wektor słowa (początek): {word_vector[:5]}...")
        for token, similarity in similar_tokens:
            print(f"  - {token}: {similarity:.4f}")

# --- WERYFIKACJA: Analogia wektorowa (kombinacja tokenów) ---

print("\n--- Weryfikacja: Analogia wektorowa ---")

tokens_analogy = ['dziecko', 'mężczyzna']

# Używamy uśredniania wektorów dla tokenów
if tokens_analogy[0] in model.wv and tokens_analogy[1] in model.wv:
    similar_to_combined = model.wv.most_similar(
        positive=tokens_analogy,
        topn=10
    )

    print(f"\n10 tokenów najbardziej podobnych do kombinacji tokenów: {tokens_analogy}")
    for token, similarity in similar_to_combined:
        print(f"  - {token}: {similarity:.4f}")
else:
    print(f"\nOstrzeżenie: Co najmniej jeden z tokenów '{tokens_analogy}' nie znajduje się w słowniku. Pominięto analogię.")

print("\n✅ Wnioskowanie zakończone.")

