"""
Skrypt do wsadowego wnioskowania na modelu Word2Vec CBOW.
Wersja przystosowana do automatycznego porównywania - zwraca wyniki w JSON.
"""

import numpy as np
import json
import sys
import logging
from gensim.models import Word2Vec
from tokenizers import Tokenizer

# Wyłączenie logowania gensim dla czystszego outputu
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.ERROR)


def get_word_vector_and_similar(word: str, tokenizer: Tokenizer, model: Word2Vec, topn: int = 3):
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
        (word_tokens, similar_tokens) - tokeny słowa i lista podobnych tokenów
        lub (None, None) jeśli słowo nie może być przetworzone
    """
    # Tokenizacja słowa na tokeny podwyrazowe
    encoding = tokenizer.encode(" " + word + " ") 
    word_tokens = [t.strip() for t in encoding.tokens if t.strip()]
    
    # Usuwamy tokeny początku/końca sekwencji, jeśli zostały dodane przez tokenizator
    if word_tokens and word_tokens[0] in ['[CLS]', '<s>', '<s>', 'Ġ']:
        word_tokens = word_tokens[1:]
    if word_tokens and word_tokens[-1] in ['[SEP]', '</s>', '</s>']:
        word_tokens = word_tokens[:-1]

    valid_vectors = []
    missing_tokens = []
    
    # Zbieranie wektorów dla każdego tokenu
    for token in word_tokens:
        if token in model.wv:
            valid_vectors.append(model.wv[token])
        else:
            missing_tokens.append(token)

    if not valid_vectors:
        return None, None

    # Uśrednianie wektorów
    word_vector = np.mean(valid_vectors, axis=0)

    # Znalezienie najbardziej podobnych tokenów
    similar_words = model.wv.most_similar(
        positive=[word_vector],
        topn=topn
    )
    
    return word_tokens, similar_words


def run_inference(tokenizer_file: str, model_file: str, test_words: list, topn: int = 3):
    """
    Uruchamia wnioskowanie dla listy słów testowych.
    
    Args:
        tokenizer_file: ścieżka do pliku tokenizera
        model_file: ścieżka do pliku modelu Word2Vec
        test_words: lista słów do przetestowania
        topn: liczba najbardziej podobnych tokenów do zwrócenia
        
    Returns:
        dict z wynikami wnioskowania
    """
    try:
        tokenizer = Tokenizer.from_file(tokenizer_file)
    except FileNotFoundError:
        return {
            "error": f"Nie znaleziono pliku tokenizera: {tokenizer_file}",
            "results": []
        }
    
    try:
        model = Word2Vec.load(model_file)
    except FileNotFoundError:
        return {
            "error": f"Nie znaleziono pliku modelu: {model_file}",
            "results": []
        }
    
    vocab_size = len(model.wv)
    results = {
        "error": None,
        "vocab_size": vocab_size,
        "results": []
    }
    
    for word in test_words:
        word_tokens, similar_tokens = get_word_vector_and_similar(
            word, tokenizer, model, topn=topn
        )
        
        if word_tokens is not None:
            results["results"].append({
                "word": word,
                "tokens": word_tokens,
                "similar": [
                    {"token": token, "similarity": float(similarity)}
                    for token, similarity in similar_tokens
                ]
            })
        else:
            results["results"].append({
                "word": word,
                "tokens": None,
                "similar": [],
                "error": "Nie można przetworzyć słowa"
            })
    
    return results


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Użycie: python inference_cbow_batch.py <tokenizer_file> <model_file> <word1> [word2] [word3] ...")
        sys.exit(1)
    
    tokenizer_file = sys.argv[1]
    model_file = sys.argv[2]
    test_words = sys.argv[3:]
    
    results = run_inference(tokenizer_file, model_file, test_words, topn=3)
    
    # Wypisz wyniki jako JSON
    print(json.dumps(results, ensure_ascii=False, indent=2))

