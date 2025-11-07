# 🚀 Szybki Start - Porównanie Parametrów CBOW

## Krok 1: Edytuj Konfigurację (1 minuta)

Otwórz plik `comparison_config.py` i zmień te dwie linie jeśli potrzebujesz:

```python
# Linia 16: Wybierz korpus
CORPUS_NAME = "PAN_TADEUSZ"  # lub "WOLNELEKTURY", "NKJP", "ALL"

# Linia 19: Wybierz tokenizer  
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"
```

## Krok 2: Uruchom Porównanie

```bash
cd M1/embedding
python run_comparison.py
```

System automatycznie:
- ✅ Wygeneruje wszystkie kombinacje parametrów
- ✅ Wytrenuje model dla każdej kombinacji
- ✅ Uruchomi wnioskowanie
- ✅ Zapisze wyniki do `comparison_results.json`
- ✅ Wygeneruje kolorowy raport do `comparison_report.txt`

## Krok 3: Zobacz Raport

Raport zostanie pokazany w konsoli z kolorowymi wykresami ASCII! 🎨

Możesz też wygenerować go ponownie w każdej chwili:

```bash
python generate_report.py
```

---

## 📊 Co Zobaczysz W Raporcie?

1. **Top 5 najlepszych konfiguracji** z wizualizacją jakości
2. **Wykresy wpływu parametrów** (kolorowe słupki ASCII)
3. **Tabele z wynikami** dla każdego słowa testowego
4. **Statystyki** (czas treningu, rozmiar słownika, etc.)

---

## 🎯 Testowanie Innych Danych?

Po prostu zmień w `comparison_config.py`:

```python
# Dla innych książek z Wolnych Lektur:
CORPUS_NAME = "WOLNELEKTURY"

# Dla NKJP z innym tokenizerem:
CORPUS_NAME = "NKJP"
TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
```

I uruchom ponownie `python run_comparison.py`!

---

**To wszystko!** System jest w pełni zautomatyzowany. 🎉

Szczegóły: zobacz `COMPARISON_README.md`

