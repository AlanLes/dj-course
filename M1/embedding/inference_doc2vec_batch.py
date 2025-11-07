import json
import logging
from gensim.models.doc2vec import Doc2Vec
from tokenizers import Tokenizer
import argparse

# Ustawienie logowania dla gensim
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def inference_doc2vec_batch(
    tokenizer_file: str,
    model_file: str,
    sentence_map_file: str,
    test_sentences: list[str]
):
    results = []
    error = None
    corpus_size = 0

    try:
        # Wczytywanie tokenizera
        tokenizer = Tokenizer.from_file(tokenizer_file)

        # Wczytywanie wytrenowanego modelu Doc2Vec
        loaded_model = Doc2Vec.load(model_file)

        # Wczytywanie mapy zdań
        with open(sentence_map_file, 'r', encoding='utf-8') as f:
            sentence_lookup = json.load(f)
        corpus_size = len(sentence_lookup)

        for sentence in test_sentences:
            # Tokenizacja nowego zdania
            new_tokens = tokenizer.encode(sentence).tokens

            # Generowanie wektora dla nowego zdania
            # Używamy epochs z modelu, aby zapewnić spójność
            inferred_vector = loaded_model.infer_vector(new_tokens, epochs=loaded_model.epochs)

            # Znajdowanie najbardziej podobnych wektorów z przestrzeni dokumentów/zdań
            most_similar_docs = loaded_model.dv.most_similar([inferred_vector], topn=5)

            similar_sentences = []
            for doc_id_str, similarity in most_similar_docs:
                doc_index = int(doc_id_str)
                try:
                    original_sentence = sentence_lookup[doc_index]
                    similar_sentences.append({"sentence": original_sentence, "similarity": similarity})
                except IndexError:
                    similar_sentences.append({"sentence": f"BŁĄD: Nie znaleziono zdania dla ID: {doc_id_str}", "similarity": similarity})
            
            results.append({"test_sentence": sentence, "similar_sentences": similar_sentences})

    except FileNotFoundError as e:
        error = f"BŁĄD: Nie znaleziono pliku: {e.filename}. Upewnij się, że pliki istnieją."
    except Exception as e:
        error = f"Wystąpił błąd podczas wnioskowania: {str(e)}"
    
    output = {"error": error, "corpus_size": corpus_size, "results": results}
    print(json.dumps(output, ensure_ascii=False, indent=4))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Perform batch inference using a trained Doc2Vec model.")
    parser.add_argument("--tokenizer_file", type=str, required=True, help="Path to the tokenizer file.")
    parser.add_argument("--model_file", type=str, required=True, help="Path to the trained Doc2Vec model file.")
    parser.add_argument("--sentence_map_file", type=str, required=True, help="Path to the sentence map JSON file.")
    parser.add_argument("--test_sentences_json", type=str, required=True, help="JSON string of test sentences.")

    args = parser.parse_args()

    test_sentences_list = json.loads(args.test_sentences_json)

    inference_doc2vec_batch(
        tokenizer_file=args.tokenizer_file,
        model_file=args.model_file,
        sentence_map_file=args.sentence_map_file,
        test_sentences=test_sentences_list
    )
