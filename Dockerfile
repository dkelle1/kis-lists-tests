# Obraz do uruchamiania testów E2E – ten sam lokalnie i w GitHub Actions.
# Bazą jest oficjalny obraz Playwrighta w wersji zgodnej z @playwright/test (przeglądarki i zależności systemowe
# są już zainstalowane – bez `npx playwright install`). Przy aktualizacji Playwrighta zmień tag razem z package.json.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Najpierw tylko manifesty – warstwa z node_modules jest cache'owana, dopóki nie zmienią się zależności.
COPY package.json package-lock.json ./
# Opcjonalny certyfikat CA proxy (np. firmowego): `docker build --secret id=ca,src=<plik.crt> …`.
# Bez niego krok działa normalnie – sekret nie trafia do warstw obrazu.
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm ci --no-audit --no-fund

COPY . .

# Dane kont i linki NIE są w obrazie – przekazuje się je przy uruchomieniu: `docker run --env-file .env …`.
# Wyniki (allure-results, allure-report, playwright-report, test-results) warto zamontować jako wolumeny.
ENV CI=true
CMD ["npx", "playwright", "test"]
