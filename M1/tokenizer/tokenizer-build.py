from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace
from corpora import get_corpus_file
from corpora import CORPORA_FILES

TOKENIZER_OUTPUT_FILE = "tokenizers/name_your_tokenizer.json"

TOKENIZER_CONFIGS = {
    "PAN_TADEUSZ": "tokenizers/tokenizer-pan-tadeusz.json",
    "WOLNELEKTURY": "tokenizers/tokenizer-wolnelektury.json",
    "NKJP": "tokenizers/tokenizer-nkjp.json",
    "ALL": "tokenizers/tokenizer-all-corpora.json",
}

# 3. Set the Trainer
trainer = BpeTrainer(
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"],
    vocab_size=32000,
    min_frequency=2
)

for corpus_name, output_file in TOKENIZER_CONFIGS.items():
    # 1. Initialize the Tokenizer (BPE model)
    tokenizer = Tokenizer(BPE(unk_token="[UNK]"))

    # 2. Set the pre-tokenizer (e.g., split on spaces)
    tokenizer.pre_tokenizer = Whitespace()

    FILES = [str(f) for f in CORPORA_FILES[corpus_name]]
    print(f"\nBudowanie tokenizera dla: {corpus_name}")
    print(f"Liczba plików: {len(FILES)}")
    # print(FILES)

    # 4. Train the Tokenizer
    tokenizer.train(FILES, trainer=trainer)

    # 5. Save the vocabulary and tokenization rules
    tokenizer.save(output_file)
    print(f"Tokenizer zapisany do: {output_file}")


for txt in [
    "Litwo! Ojczyzno moja! ty jesteś jak zdrowie.",
    "Jakże mi wesoło!",
    "Jeśli wolisz mieć pełną kontrolę nad tym, które listy są łączone (a to jest bezpieczniejsze, gdy słownik może zawierać inne klucze), po prostu prześlij listę list do spłaszczenia.",
]:
    encoded = tokenizer.encode(txt)
    print("Zakodowany tekst:", encoded.tokens)
    print("Ilość tokenów:", len(encoded.tokens))
    print("ID tokenów:", encoded.ids)
