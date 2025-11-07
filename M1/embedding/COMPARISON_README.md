# System Porównania Parametrów Word2Vec CBOW

Automatyczny system do testowania różnych konfiguracji parametrów treningu Word2Vec CBOW i generowania kolorowych raportów porównawczych.

## 📋 Struktura Plików

- `comparison_config.py` - **GŁÓWNY PLIK KONFIGURACYJNY** (modyfikuj tutaj ustawienia)
- `run_comparison.py` - Główny skrypt orkiestrujący porównanie
- `inference_cbow_batch.py` - Wnioskowanie w trybie wsadowym (zwraca JSON)
- `generate_report.py` - Generator kolorowych raportów ASCII
- `comparison_results.json` - Wyniki porównania (generowane automatycznie)
- `comparison_report.txt` - Raport tekstowy (generowane automatycznie)

## 🚀 Szybki Start

### 1. Edytuj Konfigurację

Otwórz `comparison_config.py` i dostosuj ustawienia:

```python
# Wybierz korpus
CORPUS_NAME = "PAN_TADEUSZ"  # lub "WOLNELEKTURY", "NKJP", "ALL"

# Wybierz tokenizer
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"

# Dostosuj słowa testowe
TEST_WORDS = ["zamek", "koń", "pies", "rower", "auto", "piec", "worek", "boks"]

# Dostosuj zakres parametrów do testowania
PARAMETER_GRID = {
    "VECTOR_LENGTH": [10, 20, 50],
    "WINDOW_SIZE": [3, 6, 10],
    "MIN_COUNT": [1, 2, 5],
    "WORKERS": [2, 4],
    "EPOCHS": [10, 20, 30],
    "SAMPLE_RATE": [1e-3, 1e-2],
}
```

### 2. Uruchom Porównanie

```bash
cd M1/embedding
python run_comparison.py
```

System:
- Wyliczy wszystkie kombinacje parametrów (np. 3×3×3×2×3×2 = 324 kombinacje)
- Zapyta o potwierdzenie
- Dla każdej kombinacji:
  - Wytrenuje model
  - Uruchomi wnioskowanie
  - Zapisze wyniki
- Automatycznie wygeneruje raport

### 3. Zobacz Raport

Raport zostanie automatycznie wyświetlony w konsoli i zapisany do `comparison_report.txt`.

Możesz też wygenerować raport ponownie w dowolnym momencie:

```bash
python generate_report.py
```

## 📊 Co Jest W Raporcie?

### 1. Statystyki Podsumowujące
- Liczba testowanych kombinacji
- Wskaźnik sukcesu treningów
- Statystyki czasu treningu
- Statystyki rozmiaru słownika

### 2. Top 5 Najlepszych Konfiguracji
- Ranking najlepszych kombinacji parametrów
- Średnie podobieństwo
- Czas treningu
- Wizualizacja jakości (słupki ASCII)

### 3. Wpływ Parametrów
- Kolorowe wykresy słupkowe ASCII dla każdego parametru
- Pokazują jak różne wartości parametrów wpływają na wyniki

### 4. Szczegółowe Wyniki
- Tabele z top 3 podobnymi tokenami dla każdego słowa testowego
- Porównanie wyników między różnymi konfiguracjami

## 🎨 Kolory w Raporcie

System używa kolorów ANSI do wizualizacji:
- 🟨 **Żółty** - Nagłówki i tytuły
- 🟩 **Zielony** - Najlepsze wyniki i sukcesy
- 🟦 **Cyan** - Wykresy i dane
- 🟪 **Magenta** - Statystyki
- 🟥 **Czerwony** - Błędy i ostrzeżenia

## 🔧 Zaawansowane Użycie

### Zmiana Korpusu i Tokenizera

Aby przetestować inne korpusy/tokenizery, wystarczy zmienić dwie linie w `comparison_config.py`:

```python
# Opcja 1: Pan Tadeusz
CORPUS_NAME = "PAN_TADEUSZ"
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"

# Opcja 2: Wszystkie Wolne Lektury
CORPUS_NAME = "WOLNELEKTURY"
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"

# Opcja 3: NKJP z innym tokenizerem
CORPUS_NAME = "NKJP"
TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
```

### Dostosowanie Zakresu Parametrów

Możesz zmniejszyć liczbę kombinacji testując mniej wartości:

```python
# Szybkie testowanie (2×2×2×1×2×1 = 16 kombinacji)
PARAMETER_GRID = {
    "VECTOR_LENGTH": [20, 50],
    "WINDOW_SIZE": [3, 6],
    "MIN_COUNT": [2, 5],
    "WORKERS": [4],
    "EPOCHS": [10, 20],
    "SAMPLE_RATE": [1e-2],
}
```

Lub dodać więcej wartości dla dokładniejszego porównania:

```python
# Szczegółowe testowanie (5×5×3×2×5×3 = 2250 kombinacji)
PARAMETER_GRID = {
    "VECTOR_LENGTH": [10, 20, 50, 100, 200],
    "WINDOW_SIZE": [3, 5, 7, 10, 15],
    "MIN_COUNT": [1, 2, 5],
    "WORKERS": [2, 4],
    "EPOCHS": [5, 10, 20, 30, 50],
    "SAMPLE_RATE": [1e-4, 1e-3, 1e-2],
}
```

### Dodanie Własnych Słów Testowych

```python
TEST_WORDS = [
    "król", "książę", "wojna", "miłość",
    "dziecko", "matka", "ojciec", "dom",
    "las", "góra", "rzeka", "morze"
]
```

## 📝 Format Wyników JSON

Plik `comparison_results.json` zawiera:

```json
{
  "config": {
    "corpus": "PAN_TADEUSZ",
    "tokenizer": "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json",
    "test_words": ["zamek", "koń", ...],
    "parameter_grid": {...},
    "timestamp": "2025-11-06T..."
  },
  "results": [
    {
      "combination_id": 1,
      "parameters": {
        "VECTOR_LENGTH": 10,
        "WINDOW_SIZE": 3,
        ...
      },
      "training": {
        "success": true,
        "time_seconds": 12.5,
        "error": null
      },
      "inference": {
        "vocab_size": 1234,
        "results": [
          {
            "word": "zamek",
            "tokens": ["_zamek"],
            "similar": [
              {"token": "_pałac", "similarity": 0.85},
              {"token": "_twierdza", "similarity": 0.82},
              {"token": "_forteca", "similarity": 0.78}
            ]
          },
          ...
        ]
      }
    },
    ...
  ]
}
```

## ⚠️ Uwagi

1. **Czas wykonania**: Testowanie wielu kombinacji może zająć dużo czasu. Każdy trening może trwać od kilku sekund do kilku minut w zależności od rozmiaru korpusu i parametrów.

2. **Zasoby**: System będzie wielokrotnie trenował modele. Upewnij się, że masz wystarczająco miejsca na dysku.

3. **Przerwanie**: Wyniki są zapisywane po każdej kombinacji, więc możesz bezpiecznie przerwać proces (Ctrl+C) i kontynuować później.

4. **Backup**: Skrypt modyfikuje `train_cbow.py`. Zaleca się zrobienie kopii zapasowej lub używanie kontroli wersji (git).

## 🐛 Rozwiązywanie Problemów

### "Nie znaleziono pliku tokenizera"
Sprawdź czy ścieżka w `TOKENIZER_FILE` jest poprawna względem katalogu `M1/embedding/`.

### "Trening przekroczył timeout"
Zwiększ timeout w `run_comparison.py` (linia z `timeout=600`) lub zmniejsz `EPOCHS` w konfiguracji.

### "Brak udanych wyników"
Sprawdź logi treningu. Możliwe że:
- Korpus jest zbyt mały
- Parametry są nieodpowiednie (np. MIN_COUNT za wysoki)
- Błąd w ścieżkach do plików

## 📚 Przykładowe Scenariusze

### Scenariusz 1: Szybkie porównanie dla małego korpusu
```python
CORPUS_NAME = "PAN_TADEUSZ"
PARAMETER_GRID = {
    "VECTOR_LENGTH": [20, 50],
    "WINDOW_SIZE": [5],
    "MIN_COUNT": [2],
    "WORKERS": [4],
    "EPOCHS": [10, 20],
    "SAMPLE_RATE": [1e-2],
}
```

### Scenariusz 2: Testowanie wpływu rozmiaru embeddingu
```python
CORPUS_NAME = "WOLNELEKTURY"
PARAMETER_GRID = {
    "VECTOR_LENGTH": [10, 20, 50, 100, 200],  # główny parametr
    "WINDOW_SIZE": [5],                        # stałe
    "MIN_COUNT": [2],                          # stałe
    "WORKERS": [4],                            # stałe
    "EPOCHS": [20],                            # stałe
    "SAMPLE_RATE": [1e-2],                     # stałe
}
```

### Scenariusz 3: Testowanie wpływu okna kontekstowego
```python
PARAMETER_GRID = {
    "VECTOR_LENGTH": [50],                     # stałe
    "WINDOW_SIZE": [2, 3, 5, 7, 10, 15],      # główny parametr
    "MIN_COUNT": [2],                          # stałe
    "WORKERS": [4],                            # stałe
    "EPOCHS": [20],                            # stałe
    "SAMPLE_RATE": [1e-2],                     # stałe
}
```

## 📞 Wsparcie

W przypadku problemów sprawdź:
1. Czy wszystkie zależności są zainstalowane (`requirements.txt`)
2. Czy ścieżki do korpusów i tokenizera są poprawne
3. Czy `train_cbow.py` i `inference_cbow.py` działają osobno
4. Logi w konsoli podczas uruchamiania

---

**Autor**: System automatycznego porównania parametrów CBOW  
**Data utworzenia**: 2025-11-06

