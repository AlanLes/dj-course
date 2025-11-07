import numpy as np
import json
import os
import sys
import logging

# Add the embedding directory to Python path so we can import corpora
sys.path.insert(0, r"/Users/alanleszczuk/Desktop/projects/DJ/M1/embedding/models")

from gensim.models import Word2Vec
from tokenizers import Tokenizer
from corpora import CORPORA_FILES

logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.WARNING)

# Configuration
files = ['../korpus-wolnelektury/pan-tadeusz-ksiega-9.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-12.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-8.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-11.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-10.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-6.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-7.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-5.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-4.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-1.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-3.txt', '../korpus-wolnelektury/pan-tadeusz-ksiega-2.txt']
TOKENIZER_FILE = '../tokenizer/tokenizers/tokenizer-pan-tadeusz.json'
OUTPUT_MODEL_FILE = os.path.join(r"/Users/alanleszczuk/Desktop/projects/DJ/M1/embedding/models/config_001", "embedding_word2vec_cbow_model.model")

# Parameters
VECTOR_LENGTH = 10
WINDOW_SIZE = 3
MIN_COUNT = 1
WORKERS = 2
EPOCHS = 10
SAMPLE_RATE = 0.001
SG_MODE = 0

# Load tokenizer
tokenizer = Tokenizer.from_file(TOKENIZER_FILE)

# Load sentences
def aggregate_raw_sentences(files):
    raw_sentences = []
    for file in files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f if line.strip()]
                raw_sentences.extend(lines)
        except FileNotFoundError:
            continue
    return raw_sentences

raw_sentences = aggregate_raw_sentences(files)
encodings = tokenizer.encode_batch(raw_sentences)
tokenized_sentences = [encoding.tokens for encoding in encodings]

# Train model
model = Word2Vec(
    sentences=tokenized_sentences,
    vector_size=VECTOR_LENGTH,
    window=WINDOW_SIZE,
    min_count=MIN_COUNT,
    workers=WORKERS,
    sg=SG_MODE,
    epochs=EPOCHS,
    sample=SAMPLE_RATE,
)

# Save model
os.makedirs(os.path.dirname(OUTPUT_MODEL_FILE), exist_ok=True)
model.save(OUTPUT_MODEL_FILE)
print(f"Model saved: {OUTPUT_MODEL_FILE}")
print(f"Vocab size: {len(model.wv)}")
