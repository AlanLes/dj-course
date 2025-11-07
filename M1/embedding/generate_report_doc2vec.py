import json
import argparse
import textwrap

def generate_detailed_report(data, use_color=True):
    report = []

    # Helper for colors
    class C:
        if use_color:
            HEADER = '\033[95m'
            BLUE = '\033[94m'
            CYAN = '\033[96m'
            GREEN = '\033[92m'
            YELLOW = '\033[93m'
            RED = '\033[91m'
            ENDC = '\033[0m'
            BOLD = '\033[1m'
            UNDERLINE = '\033[4m'
        else:
            HEADER, BLUE, CYAN, GREEN, YELLOW, RED, ENDC, BOLD, UNDERLINE = ('',)*9

    # --- Main Title ---
    report.append(f"{C.BOLD}{C.HEADER}{ '='*80}{C.ENDC}")
    report.append(f"{C.BOLD}{C.HEADER}{'Doc2Vec Parameter Comparison: Detailed Report':^80}{C.ENDC}")
    report.append(f"{C.BOLD}{C.HEADER}{'='*80}{C.ENDC}\n")

    # --- Detailed Results Section ---
    report.append(f"\n{C.BOLD}{C.UNDERLINE}Detailed Results per Configuration{C.ENDC}\n")

    for i, result in enumerate(data):
        params = result['params']
        training_time = result['training_time']
        inference_results = result.get('inference_results', [])
        
        # --- Configuration Header ---
        report.append(f"{C.BOLD}{C.YELLOW}{ '─'*30} Configuration ID: {i+1} {'─'*30}{C.ENDC}")
        
        # --- Parameters ---
        param_str = ", ".join([f"{k}: {v}" for k, v in params.items()])
        report.append(f"{C.BOLD}Parameters:{C.ENDC} {param_str}")
        report.append(f"{C.BOLD}Training Time:{C.ENDC} {C.CYAN}{training_time:.2f}s{C.ENDC}\n")

        if not inference_results:
            report.append(f"{C.RED}No inference results for this configuration.{C.ENDC}")
            report.append(f"{C.BOLD}{C.YELLOW}{'─'*80}{C.ENDC}\n")
            continue

        # --- Inference Results ---
        for j, infer_res in enumerate(inference_results):
            test_sentence = infer_res['test_sentence']
            similar_sentences = infer_res['similar_sentences']
            
            report.append(f"  {C.BOLD}{C.BLUE}Test Sentence {j+1}:{C.ENDC} \"{test_sentence}\"")
            
            if not similar_sentences:
                report.append(f"    {C.RED}No similar sentences found.{C.ENDC}")
                continue

            # --- Similar Sentences Table ---
            report.append(f"    {C.UNDERLINE}{'Similarity':<12} {'Sentence'}{C.ENDC}")
            for sim_sent in similar_sentences:
                similarity = sim_sent['similarity']
                sentence = sim_sent['sentence']
                
                # Color similarity based on value
                sim_color = C.GREEN if similarity > 0.95 else C.YELLOW if similarity > 0.85 else C.RED
                
                # Wrap long sentences
                wrapped_sentence_lines = textwrap.wrap(sentence, width=100) # Adjusted width
                
                report.append(f"    {sim_color}{similarity:<12.4f}{C.ENDC} {wrapped_sentence_lines[0] if wrapped_sentence_lines else ''}")
                for line in wrapped_sentence_lines[1:]:
                    report.append(f"    {' ':<12} {line}")
            report.append("") # Add a blank line for spacing
            
        report.append(f"{C.BOLD}{C.YELLOW}{'─'*80}{C.ENDC}\n")

    return "\n".join(report)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate a detailed comparison report from doc2vec results.')
    parser.add_argument('file_path', type=str, help='Path to the JSON file with comparison results.')
    parser.add_argument('--no-color', action='store_true', help='Disable color output.')
    args = parser.parse_args()

    try:
        with open(args.file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        report_content = generate_detailed_report(json_data, use_color=not args.no_color)
        print(report_content)
    except FileNotFoundError:
        print(f"Error: File not found at {args.file_path}")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {args.file_path}")
