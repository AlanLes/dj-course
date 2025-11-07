import json
import logging
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from tokenizers import Tokenizer
import os
import time
import argparse
from corpora import CORPORA_FILES

# Ustawienie logowania dla gensim
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def train_doc2vec_model(
    vector_length: int,
    window_size: int,
    min_count: int,
    workers: int,
    epochs: int,
    dm_mode: int,
    tokenizer_file: str,
    corpus_name: str,
    output_model_file: str,
    output_sentence_map: str
):
    files = CORPORA_FILES[corpus_name]

    # --- ETAP 1: Wczytanie, Tokenizacja i Przygotowanie Danych ---
    try:
        tokenizer = Tokenizer.from_file(tokenizer_file)
    except FileNotFoundError:
        print(f"BŁĄD: Nie znaleziono pliku '{tokenizer_file}'. Upewnij się, że plik istnieje.")
        raise

    # Wczytywanie i agregacja tekstu
    raw_sentences = []
    print("Wczytywanie tekstu z plików...")
    print(f"Liczba plików do wczytania: {len(files)}") 

    for file in files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f if line.strip()] 
                raw_sentences.extend(lines)
        except FileNotFoundError:
            print(f"OSTRZEŻENIE: Nie znaleziono pliku '{file}'. Pomijam.")
            continue
        except Exception as e:
            print(f"BŁĄD podczas przetwarzania pliku '{file}': {e}")
            continue

    if not raw_sentences:
        print("BŁĄD: Korpus danych jest pusty.")
        raise ValueError("Korpus danych jest pusty.")
    print(f"Tokenizacja {len(raw_sentences)} zdań...")

    # Konwersja na listę tokenów
    tokenized_sentences = [
        tokenizer.encode(sentence).tokens for sentence in raw_sentences
    ]

    # Przygotowanie danych dla Doc2Vec
    tagged_data = [
        TaggedDocument(words=tokenized_sentences[i], tags=[str(i)])
        for i in range(len(tokenized_sentences))
    ]
    print(f"Przygotowano {len(tagged_data)} sekwencji TaggedDocument do treningu.")

    # --- ETAP 2: Trening Doc2Vec ---
    print("\n--- Rozpoczynanie Treningu Doc2Vec ---")
    start_time = time.time()
    model_d2v = Doc2Vec(
        tagged_data,
        vector_size=vector_length,
        window=window_size,
        min_count=min_count,
        workers=workers,
        epochs=epochs,
        dm=dm_mode
    )
    end_time = time.time()
    training_time = end_time - start_time
    print(f"Trening zakończony pomyślnie. Czas trwania: {training_time:.2f}s")

    # --- ETAP 3: Zapisywanie Wytrenowanego Modelu i Mapy ---
    try:
        model_d2v.save(output_model_file)
        print(f"\nPełny model Doc2Vec zapisany jako: '{output_model_file}'.")
        
        with open(output_sentence_map, "w", encoding="utf-8") as f:
            json.dump(raw_sentences, f, ensure_ascii=False, indent=4)
        print(f"Mapa zdań do ID zapisana jako: '{output_sentence_map}'.")

    except Exception as e:
        print(f"BŁĄD podczas zapisu modelu/mapy: {e}.")
        raise
    
    return training_time, len(raw_sentences)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a Doc2Vec model.")
    parser.add_argument("--vector_length", type=int, default=20, help="Dimensionality of the feature vectors.")
    parser.add_argument("--window_size", type=int, default=6, help="Maximum distance between the current and predicted word within a sentence.")
    parser.add_argument("--min_count", type=int, default=4, help="Ignores all words with total frequency lower than this.")
    parser.add_argument("--workers", type=int, default=4, help="Use these many worker threads to train the model.")
    parser.add_argument("--epochs", type=int, default=20, help="Number of iterations (epochs) over the corpus.")
    parser.add_argument("--dm_mode", type=int, default=1, help="Distributed Memory (PV-DM) is used (1) or Distributed Bag of Words (PV-DBOW) (0).")
    parser.add_argument("--tokenizer_file", type=str, default="../tokenizer/tokenizers/bielik-v3-tokenizer.json", help="Path to the tokenizer file.")
    parser.add_argument("--corpus_name", type=str, default="WOLNELEKTURY", help="Name of the corpus to use from corpora.py.")
    parser.add_argument("--output_model_file", type=str, default="doc2vec_model_combined.model", help="Output file path for the trained Doc2Vec model.")
    parser.add_argument("--output_sentence_map", type=str, default="doc2vec_model_sentence_map_combined.json", help="Output file path for the sentence map.")

    args = parser.parse_args()

    train_doc2vec_model(
        vector_length=args.vector_length,
        window_size=args.window_size,
        min_count=args.min_count,
        workers=args.workers,
        epochs=args.epochs,
        dm_mode=args.dm_mode,
        tokenizer_file=args.tokenizer_file,
        corpus_name=args.corpus_name,
        output_model_file=args.output_model_file,
        output_sentence_map=args.output_sentence_map
    )
