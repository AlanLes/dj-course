"""
Generator raportów z kolorowymi wykresami ASCII dla porównania parametrów CBOW.

Ten skrypt wczytuje wyniki z comparison_results.json i generuje:
- Kolorowe wykresy ASCII
- Tabele porównawcze
- Statystyki i podsumowania
"""

import json
import statistics
from pathlib import Path
from typing import Dict, List, Any
import comparison_config as config


# Kolory ANSI
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    # Kolory tekstu
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    
    # Kolory tła
    BG_RED = '\033[101m'
    BG_GREEN = '\033[102m'
    BG_YELLOW = '\033[103m'
    BG_BLUE = '\033[104m'
    BG_MAGENTA = '\033[105m'
    BG_CYAN = '\033[106m'


def colorize(text: str, color: str, bold: bool = False) -> str:
    """Koloruje tekst."""
    prefix = Colors.BOLD if bold else ""
    return f"{prefix}{color}{text}{Colors.RESET}"


def create_bar_chart(data: Dict[str, float], title: str, max_width: int = 50, color: str = Colors.CYAN) -> str:
    """
    Tworzy kolorowy wykres słupkowy ASCII.
    
    Args:
        data: słownik {etykieta: wartość}
        title: tytuł wykresu
        max_width: maksymalna szerokość słupka w znakach
        color: kolor słupków
    """
    if not data:
        return f"{title}\n(Brak danych)\n"
    
    max_value = max(data.values())
    if max_value == 0:
        max_value = 1
    
    lines = []
    lines.append(colorize(f"\n{title}", Colors.YELLOW, bold=True))
    lines.append("=" * 80)
    
    for label, value in sorted(data.items(), key=lambda x: x[1], reverse=True):
        bar_length = int((value / max_value) * max_width)
        bar = colorize("█" * bar_length, color)
        lines.append(f"{label:20s} {bar} {value:.4f}")
    
    lines.append("")
    return "\n".join(lines)


def create_horizontal_bar(value: float, max_value: float, width: int = 20, color: str = Colors.GREEN) -> str:
    """Tworzy pojedynczy poziomy słupek."""
    if max_value == 0:
        max_value = 1
    bar_length = int((value / max_value) * width)
    bar_length = max(0, min(bar_length, width))
    return colorize("█" * bar_length, color) + "░" * (width - bar_length)


def create_table(headers: List[str], rows: List[List[str]], title: str = None) -> str:
    """Tworzy kolorową tabelę ASCII."""
    lines = []
    
    if title:
        lines.append(colorize(f"\n{title}", Colors.YELLOW, bold=True))
    
    # Oblicz szerokości kolumn
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Górna ramka
    lines.append("┌" + "┬".join("─" * (w + 2) for w in col_widths) + "┐")
    
    # Nagłówki
    header_line = "│"
    for i, header in enumerate(headers):
        header_line += " " + colorize(header.ljust(col_widths[i]), Colors.CYAN, bold=True) + " │"
    lines.append(header_line)
    
    # Separator
    lines.append("├" + "┼".join("─" * (w + 2) for w in col_widths) + "┤")
    
    # Wiersze
    for row in rows:
        row_line = "│"
        for i, cell in enumerate(row):
            row_line += " " + str(cell).ljust(col_widths[i]) + " │"
        lines.append(row_line)
    
    # Dolna ramka
    lines.append("└" + "┴".join("─" * (w + 2) for w in col_widths) + "┘")
    lines.append("")
    
    return "\n".join(lines)


def calculate_avg_similarity(inference_results: Dict) -> float:
    """Oblicza średnie podobieństwo dla wszystkich słów testowych."""
    if not inference_results or "results" not in inference_results:
        return 0.0
    
    similarities = []
    for result in inference_results["results"]:
        if "similar" in result and result["similar"]:
            for item in result["similar"]:
                similarities.append(item["similarity"])
    
    return statistics.mean(similarities) if similarities else 0.0


def generate_parameter_impact_chart(results: List[Dict]) -> str:
    """Generuje wykres wpływu każdego parametru na wyniki."""
    successful_results = [r for r in results if r["training"]["success"] and r["inference"]]
    
    if not successful_results:
        return colorize("\n⚠ Brak udanych wyników do analizy wpływu parametrów.\n", Colors.RED)
    
    # Dla każdego parametru, grupuj po wartościach i oblicz średnie podobieństwo
    param_names = list(config.PARAMETER_GRID.keys())
    
    output = []
    output.append(colorize("\n" + "=" * 80, Colors.YELLOW, bold=True))
    output.append(colorize("WPŁYW PARAMETRÓW NA ŚREDNIE PODOBIEŃSTWO", Colors.YELLOW, bold=True))
    output.append(colorize("=" * 80, Colors.YELLOW, bold=True))
    
    for param_name in param_names:
        # Grupuj wyniki według wartości tego parametru
        groups = {}
        for result in successful_results:
            param_value = result["parameters"][param_name]
            if param_value not in groups:
                groups[param_value] = []
            avg_sim = calculate_avg_similarity(result["inference"])
            groups[param_value].append(avg_sim)
        
        # Oblicz średnie dla każdej grupy
        avg_by_value = {
            str(value): statistics.mean(sims)
            for value, sims in groups.items()
        }
        
        chart = create_bar_chart(
            avg_by_value,
            f"\n{param_name}",
            max_width=40,
            color=Colors.CYAN
        )
        output.append(chart)
    
    return "\n".join(output)


def generate_top_configurations(results: List[Dict], top_n: int = 5) -> str:
    """Generuje listę najlepszych konfiguracji."""
    successful_results = [r for r in results if r["training"]["success"] and r["inference"]]
    
    if not successful_results:
        return colorize("\n⚠ Brak udanych wyników.\n", Colors.RED)
    
    # Sortuj według średniego podobieństwa
    scored_results = []
    for result in successful_results:
        avg_sim = calculate_avg_similarity(result["inference"])
        scored_results.append((result, avg_sim))
    
    scored_results.sort(key=lambda x: x[1], reverse=True)
    
    output = []
    output.append(colorize(f"\n{'=' * 80}", Colors.GREEN, bold=True))
    output.append(colorize(f"TOP {top_n} NAJLEPSZYCH KONFIGURACJI", Colors.GREEN, bold=True))
    output.append(colorize(f"{'=' * 80}", Colors.GREEN, bold=True))
    
    max_similarity = scored_results[0][1] if scored_results else 1.0
    
    for rank, (result, avg_sim) in enumerate(scored_results[:top_n], 1):
        params = result["parameters"]
        train_time = result["training"]["time_seconds"]
        vocab_size = result["inference"].get("vocab_size", 0)
        
        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, f"{rank}.")
        
        output.append(f"\n{colorize(f'{medal} MIEJSCE', Colors.YELLOW, bold=True)}")
        output.append(f"Średnie podobieństwo: {colorize(f'{avg_sim:.4f}', Colors.GREEN, bold=True)}")
        output.append(f"Czas treningu: {train_time:.1f}s | Rozmiar słownika: {vocab_size}")
        
        # Wizualizacja jakości
        bar = create_horizontal_bar(avg_sim, max_similarity, width=30, color=Colors.GREEN)
        output.append(f"Jakość: {bar}")
        
        # Parametry
        output.append(colorize("Parametry:", Colors.CYAN))
        for param_name, param_value in params.items():
            output.append(f"  • {param_name}: {param_value}")
    
    output.append("")
    return "\n".join(output)


def generate_word_similarity_table(results: List[Dict], word: str) -> str:
    """Generuje tabelę podobieństw dla konkretnego słowa."""
    successful_results = [r for r in results if r["training"]["success"] and r["inference"]]
    
    if not successful_results:
        return ""
    
    headers = ["Config ID", "Params (skrót)", "Top 3 podobne tokeny"]
    rows = []
    
    for result in successful_results:
        config_id = result["combination_id"]
        
        # Skrócony opis parametrów
        params = result["parameters"]
        param_str = f"V:{params['VECTOR_LENGTH']} W:{params['WINDOW_SIZE']} E:{params['EPOCHS']}"
        
        # Znajdź wyniki dla tego słowa
        word_result = None
        for w_result in result["inference"]["results"]:
            if w_result["word"] == word:
                word_result = w_result
                break
        
        if word_result and word_result.get("similar"):
            similar_str = ", ".join([
                f"{item['token']}({item['similarity']:.3f})"
                for item in word_result["similar"][:3]
            ])
        else:
            similar_str = colorize("(brak)", Colors.RED)
        
        rows.append([str(config_id), param_str, similar_str])
    
    return create_table(headers, rows, title=f"Wyniki podobieństwa dla słowa: '{word}'")


def generate_summary_statistics(results: List[Dict]) -> str:
    """Generuje statystyki podsumowujące."""
    total = len(results)
    successful = len([r for r in results if r["training"]["success"]])
    failed = total - successful
    
    output = []
    output.append(colorize("\n" + "=" * 80, Colors.MAGENTA, bold=True))
    output.append(colorize("STATYSTYKI PODSUMOWUJĄCE", Colors.MAGENTA, bold=True))
    output.append(colorize("=" * 80, Colors.MAGENTA, bold=True))
    
    output.append(f"\nLiczba testowanych kombinacji: {colorize(str(total), Colors.CYAN, bold=True)}")
    output.append(f"Udane treningi: {colorize(str(successful), Colors.GREEN, bold=True)}")
    output.append(f"Nieudane treningi: {colorize(str(failed), Colors.RED, bold=True)}")
    
    if successful > 0:
        success_rate = (successful / total) * 100
        output.append(f"Wskaźnik sukcesu: {colorize(f'{success_rate:.1f}%', Colors.GREEN, bold=True)}")
        
        # Statystyki czasu treningu
        train_times = [r["training"]["time_seconds"] for r in results if r["training"]["success"]]
        if train_times:
            output.append(f"\nCzas treningu:")
            output.append(f"  • Średni: {statistics.mean(train_times):.1f}s")
            output.append(f"  • Minimalny: {min(train_times):.1f}s")
            output.append(f"  • Maksymalny: {max(train_times):.1f}s")
        
        # Statystyki rozmiaru słownika
        vocab_sizes = [
            r["inference"]["vocab_size"]
            for r in results
            if r["training"]["success"] and r["inference"]
        ]
        if vocab_sizes:
            output.append(f"\nRozmiar słownika:")
            output.append(f"  • Średni: {statistics.mean(vocab_sizes):.0f}")
            output.append(f"  • Minimalny: {min(vocab_sizes)}")
            output.append(f"  • Maksymalny: {max(vocab_sizes)}")
    
    output.append("")
    return "\n".join(output)


def generate_full_report(results_file: str, output_file: str):
    """Generuje pełny raport i zapisuje do pliku."""
    
    # Wczytaj wyniki
    with open(results_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    results = data["results"]
    config_data = data["config"]
    
    # Buduj raport
    report_lines = []
    
    # Nagłówek
    report_lines.append(colorize("=" * 80, Colors.YELLOW, bold=True))
    report_lines.append(colorize("RAPORT PORÓWNANIA PARAMETRÓW WORD2VEC CBOW", Colors.YELLOW, bold=True))
    report_lines.append(colorize("=" * 80, Colors.YELLOW, bold=True))
    report_lines.append(f"\nData wygenerowania: {config_data['timestamp']}")
    report_lines.append(f"Korpus: {config_data['corpus']}")
    report_lines.append(f"Tokenizer: {config_data['tokenizer']}")
    report_lines.append(f"Słowa testowe: {', '.join(config_data['test_words'])}")
    report_lines.append("")
    
    # Statystyki podsumowujące
    report_lines.append(generate_summary_statistics(results))
    
    # Top konfiguracje
    report_lines.append(generate_top_configurations(results, top_n=5))
    
    # Wpływ parametrów
    report_lines.append(generate_parameter_impact_chart(results))
    
    # Tabele dla każdego słowa testowego
    report_lines.append(colorize("\n" + "=" * 80, Colors.BLUE, bold=True))
    report_lines.append(colorize("SZCZEGÓŁOWE WYNIKI DLA SŁÓW TESTOWYCH", Colors.BLUE, bold=True))
    report_lines.append(colorize("=" * 80, Colors.BLUE, bold=True))
    
    for word in config_data['test_words']:
        report_lines.append(generate_word_similarity_table(results, word))
    
    # Stopka
    report_lines.append(colorize("\n" + "=" * 80, Colors.YELLOW, bold=True))
    report_lines.append(colorize("KONIEC RAPORTU", Colors.YELLOW, bold=True))
    report_lines.append(colorize("=" * 80, Colors.YELLOW, bold=True))
    report_lines.append("")
    
    # Złącz wszystko
    full_report = "\n".join(report_lines)
    
    # Wyświetl w konsoli
    print(full_report)
    
    # Zapisz do pliku (bez kolorów ANSI)
    report_no_ansi = full_report
    for color_code in [Colors.RESET, Colors.BOLD, Colors.RED, Colors.GREEN, Colors.YELLOW,
                       Colors.BLUE, Colors.MAGENTA, Colors.CYAN, Colors.WHITE]:
        report_no_ansi = report_no_ansi.replace(color_code, "")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report_no_ansi)
    
    print(colorize(f"\n✅ Raport zapisany do: {output_file}", Colors.GREEN, bold=True))


def main():
    """Główna funkcja."""
    results_file = config.OUTPUT_RESULTS_FILE
    output_file = config.OUTPUT_REPORT_FILE
    
    if not Path(results_file).exists():
        print(colorize(f"❌ BŁĄD: Nie znaleziono pliku z wynikami: {results_file}", Colors.RED, bold=True))
        print("Najpierw uruchom: python run_comparison.py")
        return
    
    try:
        generate_full_report(results_file, output_file)
    except Exception as e:
        print(colorize(f"❌ BŁĄD podczas generowania raportu: {e}", Colors.RED, bold=True))
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

