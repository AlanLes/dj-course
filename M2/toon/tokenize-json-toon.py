from tokenizers import Tokenizer
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKENIZER_DIR = os.path.join(SCRIPT_DIR, 'tokenizers')
SAMPLES_DIR = os.path.join(SCRIPT_DIR, 'samples')

FORMATS = ['json', 'nows-json', 'yaml', 'toon']

# all available tokenizer names from the tokenizers directory (without extension)
ALL_TOKENIZERS = sorted([f[:-5] for f in os.listdir(TOKENIZER_DIR) if f.endswith('.json')])

if not os.path.isdir(TOKENIZER_DIR):
    print(f"❌ Error: Tokenizer directory not found at {TOKENIZER_DIR}")
    exit(1)

# Load all tokenizers
tokenizers = {}
for name in ALL_TOKENIZERS:
    tokenizers[name] = Tokenizer.from_file(os.path.join(TOKENIZER_DIR, f"{name}.json"))
    print(f"✅ Successfully loaded tokenizer: {name}")

# all available sample names from the samples directory
SAMPLE_NAMES = sorted([f[:-5] for f in os.listdir(SAMPLES_DIR) 
                if f.endswith('.json') and not f.endswith('-nows.json')])

# Główna struktura danych: { tokenizer_name: { sample_name: { format: count } } }
all_results = {tok: {} for tok in ALL_TOKENIZERS}

for tokenizer_name, tokenizer in tokenizers.items():
    for sample_name in SAMPLE_NAMES:
        sample_data = {}

        file_path_json = os.path.join(SAMPLES_DIR, f"{sample_name}.json")
        try:
            with open(file_path_json, "r", encoding="utf-8") as f:
                sample_data['json'] = f.read()
        except FileNotFoundError:
            sample_data['json'] = ""

        file_path_nows = os.path.join(SAMPLES_DIR, f"{sample_name}-nows.json")
        try:
            with open(file_path_nows, "r", encoding="utf-8") as f:
                sample_data['nows-json'] = f.read()
        except FileNotFoundError:
            sample_data['nows-json'] = ""

        file_path_toon = os.path.join(SAMPLES_DIR, f"{sample_name}.toon")
        try:
            with open(file_path_toon, "r", encoding="utf-8") as f:
                sample_data['toon'] = f.read()
        except FileNotFoundError:
            sample_data['toon'] = ""

        file_path_yaml = os.path.join(SAMPLES_DIR, f"{sample_name}.yaml")
        try:
            with open(file_path_yaml, "r", encoding="utf-8") as f:
                sample_data['yaml'] = f.read()
        except FileNotFoundError:
            sample_data['yaml'] = ""

        if all(value == "" for value in sample_data.values()):
            continue

        try:
            encoded_json = tokenizer.encode(json.dumps(sample_data.get('json', '')))
            encoded_nows_json = tokenizer.encode(json.dumps(sample_data.get('nows-json', '')))
            encoded_toon = tokenizer.encode(sample_data.get('toon', ''))
            encoded_yaml = tokenizer.encode(sample_data.get('yaml', ''))

            all_results[tokenizer_name][sample_name] = {
                'json': len(encoded_json.ids),
                'nows-json': len(encoded_nows_json.ids),
                'yaml': len(encoded_yaml.ids),
                'toon': len(encoded_toon.ids),
            }
        except Exception as e:
            print(f"❌ Error processing '{sample_name}' with '{tokenizer_name}': {e}")


def print_ascii_table(headers, rows, title=None):
    """Generuje i drukuje tabelę ASCII."""
    col_widths = [max(len(str(row[i])) for row in [headers] + rows) for i in range(len(headers))]
    
    def row_str(row):
        return "│ " + " │ ".join(str(cell).rjust(col_widths[i]) for i, cell in enumerate(row)) + " │"
    
    separator = "├─" + "─┼─".join("─" * w for w in col_widths) + "─┤"
    top_border = "┌─" + "─┬─".join("─" * w for w in col_widths) + "─┐"
    bottom_border = "└─" + "─┴─".join("─" * w for w in col_widths) + "─┘"
    
    if title:
        print(f"\n{title}")
    print(top_border)
    print(row_str(headers))
    print(separator)
    for row in rows:
        print(row_str(row))
    print(bottom_border)


def print_table_per_tokenizer():
    """Tabela dla każdego tokenizera osobno."""
    for tok_name in ALL_TOKENIZERS:
        headers = ["Sample"] + FORMATS
        rows = []
        for sample in SAMPLE_NAMES:
            if sample in all_results[tok_name]:
                counts = all_results[tok_name][sample]
                rows.append([sample] + [counts[fmt] for fmt in FORMATS])
        if rows:
            print_ascii_table(headers, rows, title=f"Tokenizer: {tok_name}")


def print_table_per_sample():
    """Tabela dla każdego sample osobno - porównanie tokenizerów."""
    for sample in SAMPLE_NAMES:
        headers = ["Tokenizer"] + FORMATS
        rows = []
        for tok_name in ALL_TOKENIZERS:
            if sample in all_results[tok_name]:
                counts = all_results[tok_name][sample]
                rows.append([tok_name] + [counts[fmt] for fmt in FORMATS])
        if rows:
            print_ascii_table(headers, rows, title=f"Sample: {sample}")


def print_summary_table():
    """Zbiorcza tabela ze wszystkimi wynikami (tokeny toon vs json %)."""
    headers = ["Tokenizer", "Sample", "JSON", "NOWS-JSON", "YAML", "TOON", "TOON vs JSON %", "TOON vs NOWS-JSON %", "TOON vs YAML %"]
    rows = []
    for tok_name in ALL_TOKENIZERS:
        for sample in SAMPLE_NAMES:
            if sample in all_results[tok_name]:
                c = all_results[tok_name][sample]
                ratio = f"{100-(100*c['toon']/c['json']):.1f}%" if c['json'] > 0 else "N/A"
                ratio_nows_json = f"{100-(100*c['toon']/c['nows-json']):.1f}%" if c['nows-json'] > 0 else "N/A"
                ratio_yaml = f"{100-(100*c['toon']/c['yaml']):.1f}%" if c['yaml'] > 0 else "N/A"
                rows.append([tok_name, sample, c['json'], c['nows-json'], c['yaml'], c['toon'], ratio, ratio_nows_json, ratio_yaml])
    print_ascii_table(headers, rows, title="Podsumowanie wszystkich wyników")


# Wyświetl tabele
print("\n" + "="*80)
print("WYNIKI TOKENIZACJI")
print("="*80)

print_table_per_sample()
print_summary_table()