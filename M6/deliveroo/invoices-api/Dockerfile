# ── Stage 1: builder ──────────────────────────────────────────────────────────
# Używamy pełnego obrazu node:20-alpine jako bazy do budowania.
# 'alpine' to miniaturalna dystrybucja Linuxa – waży ~5 MB zamiast ~200 MB Debiana.
FROM node:20-alpine AS builder

# Ustawiamy katalog roboczy na /app – to standardowa konwencja w Dockerze, nie musi istnieć w repo. 
# Docker sam utworzy ten katalog w obrazie, jeśli go nie ma – to po prostu miejsce, gdzie wrzucamy kod.
WORKDIR /app

# Kopiujemy TYLKO pliki z definicją zależności (nie cały kod).
# Dzięki temu Docker może zcache'ować ten layer – jeśli package.json się nie zmieni,
# nie będzie ponownie instalował paczek przy kolejnym buildzie.
COPY package.json package-lock.json* ./

# Instalujemy WSZYSTKIE zależności (też devDependencies – potrzebujemy tsc)
RUN npm ci

# Teraz dopiero kopiujemy resztę kodu źródłowego
COPY tsconfig.json ./
COPY src/ ./src/

# Kompilujemy TypeScript → JavaScript (wynik ląduje w katalogu /app/dist/)
RUN npm run build

# ── Stage 2: runner ────────────────────────────────────────────────────────────
# Świeży, mały obraz – bez śladów stage'a builder (bez tsc, bez devDependencies)
FROM node:20-alpine AS runner

WORKDIR /app

# Kopiujemy tylko package.json żeby zainstalować TYLKO produkcyjne zależności
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Kopiujemy skompilowany JS z etapu builder
COPY --from=builder /app/dist ./dist

# Dokumentujemy (nieobowiązkowo) na jakim porcie nasłuchuje aplikacja
EXPOSE 3100

# Komenda startowa: uruchom skompilowany plik JS
CMD ["node", "dist/index.js"]
