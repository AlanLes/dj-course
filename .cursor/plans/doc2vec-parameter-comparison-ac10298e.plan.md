<!-- ac10298e-27ac-4244-8db0-507489995573 40ff8888-2767-4fe2-9047-cb8d543d0e56 -->
# Plan: System Porównania Parametrów Doc2Vec

## Przegląd

Utworzenie pełnego systemu do automatycznego testowania różnych konfiguracji parametrów Doc2Vec, analogicznego do istniejącego systemu CBOW. System będzie trenował modele Doc2Vec z różnymi kombinacjami parametrów, uruchamiał wnioskowanie na zdaniach testowych i generował kolorowe raporty ASCII z wykresami porównawczymi.

## Struktura Plików

Zostaną utworzone 5 nowych plików w katalogu `/Users/alanleszczuk/Desktop/projects/DJ/M1/embedding/`:

1. **train_doc2vec.py** - skrypt treningowy (wydzielony z run-doc2vec.py)
2. **inference_doc2vec_batch.py** - wsadowe wnioskowanie dla zdań testowych
3. **comparison_config_doc2vec.py** - konfiguracja parametrów i zdań testowych
4. **run_comparison_doc2vec.py** - orkiestrator uruchamiający wszystkie kombinacje
5. **generate_report_doc2vec.py** - generator kolorowych raportów ASCII

Dodatkowo zostanie utworzony plik z planem:

6. **DOC2VEC_COMPARISON_PLAN.md** - szczegółowy plan w markdown

## Parametry do Testowania

Na podstawie linii 22-28 z `run-doc2vec.py`:

```python
VECTOR_LENGTH: [10, 20, 50]
WINDOW_SIZE: [3, 6, 10]
MIN_COUNT: [1, 4]
WORKERS: [4]  # stały
EPOCHS: [10, 20, 30]
DM_MODE: [0, 1]  # 0=DBOW, 1=DM
```

**Łącznie: 3 × 3 × 2 × 1 × 3 × 2 = 108 kombinacji**

## Zdania Testowe

```
1. "Wczoraj jechałem na rowerze"
2. "Mój syn jest chory i ma gorączkę"
3. "Kocham moją żonę i uważam, że bardzo wiele dla mnie robi"
```

## Kluczowe Różnice Doc2Vec vs Word2Vec

- **Dane wejściowe**: TaggedDocument (zdania z tagami ID) vs lista tokenów
- **Wnioskowanie**: `model.infer_vector(tokens)` + `model.dv.most_similar()` vs `model.wv.most_similar()`
- **Parametry**: `dm` (0/1) zamiast `sg` (0/1)
- **Wyniki**: podobieństwo między zdaniami zamiast między tokenami

## Implementacja

### 1. train_doc2vec.py

- Wczytanie korpusu WOLNELEKTURY
- Tokenizacja zdań (tokenizer Bielik v3)
- Tworzenie TaggedDocument dla każdego zdania
- Trening modelu Doc2Vec z parametrami z pliku
- Zapis modelu i mapy zdań do JSON

### 2. inference_doc2vec_batch.py

- Przyjmuje: tokenizer_file, model_file, sentence_map_file, lista zdań testowych
- Dla każdego zdania:
  - Tokenizacja
  - Generowanie wektora przez `infer_vector()`
  - Znalezienie 5 najbardziej podobnych zdań z korpusu
  - Zwrócenie wyników w JSON
- Format wyjścia: `{"error": null, "corpus_size": N, "results": [...]}`

### 3. comparison_config_doc2vec.py

- CORPUS_NAME = "WOLNELEKTURY"
- TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v3-tokenizer.json"
- TEST_SENTENCES (3 zdania wskazane przez użytkownika)
- PARAMETER_GRID (zakresy parametrów)
- OUTPUT_RESULTS_FILE = "comparison_results_doc2vec.json"
- OUTPUT_REPORT_FILE = "comparison_report_doc2vec.txt"

### 4. run_comparison_doc2vec.py

- Generowanie wszystkich kombinacji parametrów (108 sztuk)
- Pętla przez każdą kombinację:
  - Modyfikacja train_doc2vec.py (zmiana wartości parametrów)
  - Uruchomienie treningu (subprocess)
  - Uruchomienie wnioskowania (subprocess)
  - Zbieranie wyników i metryk
- Zapis wyników do JSON po każdej iteracji
- Wywołanie generate_report_doc2vec.py na końcu

### 5. generate_report_doc2vec.py

- Kolorowe wykresy ASCII (biblioteka wbudowana, bez zewnętrznych zależności)
- Sekcje raportu:
  - **Statystyki podsumowujące**: liczba kombinacji, sukces/porażka, czasy
  - **TOP 5 najlepszych konfiguracji**: ranking według średniego podobieństwa
  - **Wpływ parametrów**: wykresy słupkowe dla każdego parametru
  - **Szczegółowe wyniki**: tabele z podobnymi zdaniami dla każdego zdania testowego
- Kolory ANSI: zielony (sukces), czerwony (błąd), żółty (nagłówki), cyan (dane)
- Zapis do pliku TXT (bez kolorów) + wyświetlenie w konsoli (z kolorami)

### 6. DOC2VEC_COMPARISON_PLAN.md

- Pełny plan w formacie markdown
- Instrukcje użycia
- Opis parametrów
- Przykłady uruchomienia
- Struktura plików wyjściowych

## Metryki Porównawcze

- **Średnie podobieństwo**: średnia wartość similarity dla wszystkich zdań testowych
- **Czas treningu**: czas w sekundach
- **Rozmiar korpusu**: liczba zdań w modelu
- **Stabilność**: czy trening się powiódł

## Przykład Użycia

```bash
# 1. Konfiguracja (opcjonalnie edytować comparison_config_doc2vec.py)
# 2. Uruchomienie porównania
python run_comparison_doc2vec.py

# 3. Wygenerowanie raportu (automatyczne, ale można ponownie)
python generate_report_doc2vec.py
```

## Pliki Wyjściowe

- **comparison_results_doc2vec.json**: pełne wyniki w formacie JSON
- **comparison_report_doc2vec.txt**: czytelny raport z wykresami ASCII
- **doc2vec_model_combined.model**: ostatni wytrenowany model
- **doc2vec_model_sentence_map_combined.json**: mapa zdań do ID

TODOS:
[ ] - Utworzenie pliku DOC2VEC_COMPARISON_PLAN.md z pełnym planem
[ ] - Utworzenie train_doc2vec.py - skrypt treningowy wydzielony z run-doc2vec.py
[ ] - Utworzenie inference_doc2vec_batch.py - wsadowe wnioskowanie dla zdań
[ ] - Utworzenie comparison_config_doc2vec.py - konfiguracja parametrów i zdań testowych
[ ] - Utworzenie run_comparison_doc2vec.py - orkiestrator uruchamiający kombinacje
[ ] - Utworzenie generate_report_doc2vec.py - generator kolorowych raportów ASCII

### To-dos

- [ ] Utworzenie pliku DOC2VEC_COMPARISON_PLAN.md z pełnym planem
- [ ] Utworzenie train_doc2vec.py - skrypt treningowy wydzielony z run-doc2vec.py
- [ ] Utworzenie inference_doc2vec_batch.py - wsadowe wnioskowanie dla zdań
- [ ] Utworzenie comparison_config_doc2vec.py - konfiguracja parametrów i zdań testowych
- [ ] Utworzenie run_comparison_doc2vec.py - orkiestrator uruchamiający kombinacje
- [ ] Utworzenie generate_report_doc2vec.py - generator kolorowych raportów ASCII