import json
import subprocess
import itertools
import time
import os

# Import konfiguracji
from comparison_config_doc2vec import (
    CORPUS_NAME,
    TOKENIZER_FILE,
    TEST_SENTENCES,
    PARAMETER_GRID,
    OUTPUT_RESULTS_FILE,
    OUTPUT_REPORT_FILE,
    TEMP_MODEL_FILE,
    TEMP_SENTENCE_MAP
)

# Ścieżki do skryptów
TRAIN_SCRIPT = os.path.join(os.path.dirname(__file__), "train_doc2vec.py")
INFERENCE_SCRIPT = os.path.join(os.path.dirname(__file__), "inference_doc2vec_batch.py")
REPORT_SCRIPT = os.path.join(os.path.dirname(__file__), "generate_report_doc2vec.py")

def run_comparison():
    all_results = []
    param_keys = list(PARAMETER_GRID.keys())
    param_values = list(PARAMETER_GRID.values())
    
    # Generowanie wszystkich kombinacji parametrów
    param_combinations = list(itertools.product(*param_values))
    total_combinations = len(param_combinations)
    print(f"Rozpoczynanie porównania dla {total_combinations} kombinacji parametrów Doc2Vec...")

    for i, combo in enumerate(param_combinations):
        params = dict(zip(param_keys, combo))
        print(f"\n--- Uruchamianie kombinacji {i+1}/{total_combinations}: {params} ---")

        current_result = {"params": params, "training_time": None, "corpus_size": None, "inference_results": None, "error": None}

        # 1. Trening modelu
        train_command = [
            "python", TRAIN_SCRIPT,
            f"--vector_length={params['vector_length']}",
            f"--window_size={params['window_size']}",
            f"--min_count={params['min_count']}",
            f"--workers={params['workers']}",
            f"--epochs={params['epochs']}",
            f"--dm_mode={params['dm_mode']}",
            f"--tokenizer_file={TOKENIZER_FILE}",
            f"--corpus_name={CORPUS_NAME}",
            f"--output_model_file={TEMP_MODEL_FILE}",
            f"--output_sentence_map={TEMP_SENTENCE_MAP}"
        ]
        
        try:
            train_process = subprocess.run(train_command, capture_output=True, text=True, check=True)
            # print("Train STDOUT:", train_process.stdout)
            # print("Train STDERR:", train_process.stderr)
            
            # Próba parsowania czasu treningu i rozmiaru korpusu z stdout
            training_time_line = next((line for line in train_process.stdout.splitlines() if "Czas trwania" in line), None)
            if training_time_line:
                current_result["training_time"] = float(training_time_line.split("Czas trwania: ")[1].split("s")[0])
            
            corpus_size_line = next((line for line in train_process.stdout.splitlines() if "Tokenizacja" in line), None)
            if corpus_size_line:
                current_result["corpus_size"] = int(corpus_size_line.split("Tokenizacja ")[1].split(" zdań")[0])

            # 2. Wnioskowanie
            test_sentences_json = json.dumps(TEST_SENTENCES, ensure_ascii=False)
            inference_command = [
                "python", INFERENCE_SCRIPT,
                f"--tokenizer_file={TOKENIZER_FILE}",
                f"--model_file={TEMP_MODEL_FILE}",
                f"--sentence_map_file={TEMP_SENTENCE_MAP}",
                f"--test_sentences_json={test_sentences_json}"
            ]
            inference_process = subprocess.run(inference_command, capture_output=True, text=True, check=True)
            # print("Inference STDOUT:", inference_process.stdout)
            # print("Inference STDERR:", inference_process.stderr)
            
            inference_output = json.loads(inference_process.stdout)
            if inference_output.get("error"):
                current_result["error"] = inference_output["error"]
            else:
                current_result["inference_results"] = inference_output["results"]

        except subprocess.CalledProcessError as e:
            current_result["error"] = f"Skrypt zakończył się błędem: {e.stderr}"
            print(f"BŁĄD podczas uruchamiania skryptu: {e.stderr}")
        except json.JSONDecodeError as e:
            current_result["error"] = f"BŁĄD podczas parsowania JSON: {e}. Output: {inference_process.stdout}"
            print(f"BŁĄD podczas parsowania JSON: {e}. Output: {inference_process.stdout}")
        except Exception as e:
            current_result["error"] = f"Nieoczekiwany błąd: {str(e)}"
            print(f"Nieoczekiwany błąd: {str(e)}")
        finally:
            all_results.append(current_result)
            # Usuwanie tymczasowych plików
            if os.path.exists(TEMP_MODEL_FILE):
                os.remove(TEMP_MODEL_FILE)
            if os.path.exists(TEMP_SENTENCE_MAP):
                os.remove(TEMP_SENTENCE_MAP)

    # Zapis wyników do pliku JSON
    with open(OUTPUT_RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=4)
    print(f"\nZapisano wszystkie wyniki porównania do: {OUTPUT_RESULTS_FILE}")

    # Generowanie raportu
    print(f"\nGenerowanie raportu do: {OUTPUT_REPORT_FILE}...")
    try:
        report_command = ["python", REPORT_SCRIPT]
        report_process = subprocess.run(report_command, capture_output=True, text=True, check=True)
        print(report_process.stdout)
        if report_process.stderr:
            print("Report STDERR:", report_process.stderr)
    except subprocess.CalledProcessError as e:
        print(f"BŁĄD podczas generowania raportu: {e.stderr}")
    except Exception as e:
        print(f"Nieoczekiwany błąd podczas generowania raportu: {str(e)}")

if __name__ == "__main__":
    run_comparison()
