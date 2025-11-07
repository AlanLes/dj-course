"""
Główny skrypt do uruchamiania porównania parametrów Word2Vec CBOW.

Ten skrypt:
1. Wczytuje konfigurację z comparison_config.py
2. Generuje wszystkie kombinacje parametrów
3. Dla każdej kombinacji:
   - Modyfikuje parametry w train_cbow.py
   - Uruchamia trening
   - Uruchamia wnioskowanie
   - Zbiera wyniki
4. Zapisuje wszystkie wyniki do pliku JSON
5. Generuje raport porównawczy
"""

import json
import subprocess
import time
import itertools
from pathlib import Path
from datetime import datetime
import sys

# Import konfiguracji
import comparison_config as config
from corpora import CORPORA_FILES


def modify_train_script(params: dict, corpus_name: str, tokenizer_file: str):
    """
    Modyfikuje plik train_cbow.py z nowymi parametrami.
    
    Args:
        params: słownik z parametrami treningu
        corpus_name: nazwa korpusu z CORPORA_FILES
        tokenizer_file: ścieżka do pliku tokenizera
    """
    train_file = Path("train_cbow.py")
    
    with open(train_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Modyfikacja linii z parametrami
    for i, line in enumerate(lines):
        # Korpus (linia ~16)
        if line.strip().startswith('files = CORPORA_FILES['):
            lines[i] = f'files = CORPORA_FILES["{corpus_name}"]\n'
        
        # Tokenizer (linia ~20)
        elif line.strip().startswith('TOKENIZER_FILE = '):
            lines[i] = f'TOKENIZER_FILE = "{tokenizer_file}"\n'
        
        # Parametry treningu (linie 29-34)
        elif line.strip().startswith('VECTOR_LENGTH = '):
            lines[i] = f'VECTOR_LENGTH = {params["VECTOR_LENGTH"]}\n'
        elif line.strip().startswith('WINDOW_SIZE = '):
            lines[i] = f'WINDOW_SIZE = {params["WINDOW_SIZE"]}\n'
        elif line.strip().startswith('MIN_COUNT = '):
            lines[i] = f'MIN_COUNT = {params["MIN_COUNT"]}\n'
        elif line.strip().startswith('WORKERS = '):
            lines[i] = f'WORKERS = {params["WORKERS"]}\n'
        elif line.strip().startswith('EPOCHS = '):
            lines[i] = f'EPOCHS = {params["EPOCHS"]}\n'
        elif line.strip().startswith('SAMPLE_RATE = '):
            lines[i] = f'SAMPLE_RATE = {params["SAMPLE_RATE"]}\n'
    
    # Zapisz zmodyfikowany plik
    with open(train_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)


def run_training():
    """
    Uruchamia trening Word2Vec CBOW.
    
    Returns:
        (success, elapsed_time, error_message)
    """
    print("  Uruchamianie treningu...")
    start_time = time.time()
    
    try:
        result = subprocess.run(
            [sys.executable, "train_cbow.py"],
            capture_output=True,
            text=True,
            timeout=600  # 10 minut timeout
        )
        elapsed_time = time.time() - start_time
        
        if result.returncode == 0:
            print(f"  ✓ Trening zakończony ({elapsed_time:.1f}s)")
            return True, elapsed_time, None
        else:
            print(f"  ✗ Trening zakończony z błędem")
            return False, elapsed_time, result.stderr
    
    except subprocess.TimeoutExpired:
        elapsed_time = time.time() - start_time
        print(f"  ✗ Trening przekroczył timeout ({elapsed_time:.1f}s)")
        return False, elapsed_time, "Timeout"
    
    except Exception as e:
        elapsed_time = time.time() - start_time
        print(f"  ✗ Błąd podczas treningu: {e}")
        return False, elapsed_time, str(e)


def run_inference(tokenizer_file: str, model_file: str, test_words: list):
    """
    Uruchamia wnioskowanie na modelu.
    
    Returns:
        dict z wynikami wnioskowania
    """
    print("  Uruchamianie wnioskowania...")
    
    try:
        result = subprocess.run(
            [sys.executable, "inference_cbow_batch.py", tokenizer_file, model_file] + test_words,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            inference_results = json.loads(result.stdout)
            print(f"  ✓ Wnioskowanie zakończone")
            return inference_results
        else:
            print(f"  ✗ Wnioskowanie zakończone z błędem")
            return {"error": result.stderr, "results": []}
    
    except Exception as e:
        print(f"  ✗ Błąd podczas wnioskowania: {e}")
        return {"error": str(e), "results": []}


def generate_parameter_combinations(parameter_grid: dict):
    """
    Generuje wszystkie kombinacje parametrów z siatki.
    
    Returns:
        lista słowników z kombinacjami parametrów
    """
    keys = parameter_grid.keys()
    values = parameter_grid.values()
    
    combinations = []
    for combo in itertools.product(*values):
        combinations.append(dict(zip(keys, combo)))
    
    return combinations


def main():
    """
    Główna funkcja uruchamiająca porównanie.
    """
    print("=" * 80)
    print("PORÓWNANIE PARAMETRÓW WORD2VEC CBOW")
    print("=" * 80)
    print(f"\nKorpus: {config.CORPUS_NAME}")
    print(f"Tokenizer: {config.TOKENIZER_FILE}")
    print(f"Słowa testowe: {', '.join(config.TEST_WORDS)}")
    
    # Generuj kombinacje parametrów
    combinations = generate_parameter_combinations(config.PARAMETER_GRID)
    total = len(combinations)
    
    print(f"\nLiczba kombinacji do przetestowania: {total}")
    print("=" * 80)
    
    # Zapytaj użytkownika czy kontynuować
    response = input(f"\nCzy chcesz kontynuować? (tak/nie): ")
    if response.lower() not in ['tak', 't', 'yes', 'y']:
        print("Anulowano.")
        return
    
    # Wyniki
    all_results = {
        "config": {
            "corpus": config.CORPUS_NAME,
            "tokenizer": config.TOKENIZER_FILE,
            "test_words": config.TEST_WORDS,
            "parameter_grid": config.PARAMETER_GRID,
            "timestamp": datetime.now().isoformat()
        },
        "results": []
    }
    
    # Dla każdej kombinacji parametrów
    for idx, params in enumerate(combinations, 1):
        print(f"\n[{idx}/{total}] Testowanie kombinacji: {params}")
        
        # Modyfikuj skrypt treningowy
        modify_train_script(params, config.CORPUS_NAME, config.TOKENIZER_FILE)
        
        # Uruchom trening
        train_success, train_time, train_error = run_training()
        
        result_entry = {
            "combination_id": idx,
            "parameters": params,
            "training": {
                "success": train_success,
                "time_seconds": train_time,
                "error": train_error
            },
            "inference": None
        }
        
        # Jeśli trening się powiódł, uruchom wnioskowanie
        if train_success:
            inference_results = run_inference(
                config.TOKENIZER_FILE,
                "embedding_word2vec_cbow_model.model",
                config.TEST_WORDS
            )
            result_entry["inference"] = inference_results
        
        all_results["results"].append(result_entry)
        
        # Zapisz wyniki po każdej iteracji (na wypadek awarii)
        with open(config.OUTPUT_RESULTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✅ ZAKOŃCZONO PORÓWNANIE")
    print(f"Wyniki zapisano do: {config.OUTPUT_RESULTS_FILE}")
    print("=" * 80)
    
    # Wygeneruj raport
    print("\nGenerowanie raportu...")
    try:
        subprocess.run([sys.executable, "generate_report.py"], check=True)
        print(f"✅ Raport wygenerowany: {config.OUTPUT_REPORT_FILE}")
    except Exception as e:
        print(f"⚠ Błąd podczas generowania raportu: {e}")
        print("Możesz wygenerować raport ręcznie uruchamiając: python generate_report.py")


if __name__ == "__main__":
    main()

