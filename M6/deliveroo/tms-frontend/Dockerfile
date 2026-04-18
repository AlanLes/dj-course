# =============================================================
# STAGE 1: deps — instalacja zaleznosci
# =============================================================
# node:22-alpine zamiast node:22-bullseye
# alpine = minimalistyczny Linux (~5 MB), bullseye = pelny Debian (~170 MB)
# Dzieki temu sam stage jest kilkadziesiat razy mniejszy
FROM node:22-alpine AS deps

WORKDIR /app

# Kopiujemy TYLKO package.json i package-lock.json
# (nie caly kod zrodlowy!)
# Dzieki temu Docker cache dla tego kroku jest inwalidowny TYLKO
# gdy zmienia sie lista zaleznosci — nie przy kazdej zmianie kodu
COPY package*.json ./

# --mount=type=cache,target=/root/.npm
#   Montuje katalog cache npm spoza obrazu.
#   ~/.npm to miejsce, gdzie npm trzyma pobrane paczki (.tgz)
#   Ten katalog NIE trafia do finalnego obrazu — jest tylko do uzytku
#   w czasie budowania. Przy kolejnym buildzie npm nie pobiera paczek
#   z internetu — czyta z tego cache.
#
# npm ci (zamiast npm install):
#   - czyta package-lock.json i instaluje DOKLADNIE te wersje
#   - szybsze niz npm install w CI/CD
#   - gwarantuje reprodukowalny build
#   - wymaga package-lock.json (mamy go w projekcie)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline


# =============================================================
# STAGE 2: builder — kompilacja TypeScript/JSX do statycznych plikow
# =============================================================
# Zaczynamy od stage deps (juz ma zainstalowane node_modules)
FROM deps AS builder

# Teraz kopiujemy caly kod zrodlowy
COPY . .

# Vite kompiluje TypeScript, JSX, CSS-modules do czystego HTML/CSS/JS
# Wynik laduje w katalogu /app/dist
RUN npm run build


# =============================================================
# STAGE 3: production — lekki serwer HTTP
# =============================================================
# nginx:alpine to minimalny serwer HTTP
# Caly obraz wazy ~40 MB (vs ~1 GB dla node:22-bullseye!)
# Node.js, npm, node_modules — nic z tego nie trafia tutaj
FROM nginx:alpine AS production

# Kopiujemy TYLKO skompilowane pliki statyczne z poprzedniego stage
# Nic wiecej nie jest potrzebne do serwowania Reacta
COPY --from=builder /app/dist /usr/share/nginx/html

# Nasz wlasny plik konfiguracyjny nginx (port 8080, SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Konfigurujemy nginx do pracy jako non-root:
# nginx domyslnie zapisuje PID procesu do /var/run/nginx.pid
# Ten plik jest wlasnoscia root. Zmieniamy sciezke na /tmp/nginx.pid
# ktore jest zapisywalne przez wszystkich uzytkownikow.
RUN sed -i 's|/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf \
    # Nadajemy uzytkownikowi 'nginx' (uid 101, wbudowany w obraz) prawa
    # do katalogow, do ktorych nginx musi pisac w czasie pracy
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d

# Przelaczamy aktywnego uzytkownika kontenera na 'nginx'
# Od tego miejsca WSZYSTKIE kolejne instrukcje (w tym CMD) dzialaja
# jako nieprzywilejonwy uzytkownik — nie root
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
# "daemon off;" mowi nginx-owi, zeby NIE przechodzil w tryb demona
# (proces w tle). Docker wymaga, zeby glowny proces byl na pierwszym
# planie (foreground) — inaczej kontener sie zatrzymuje.