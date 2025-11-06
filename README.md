# 🛒 Smart Shopping List - MVP

Aplikacja webowa do zarządzania listą zakupów zgodna z wymaganiami MVP.

## Funkcjonalności MVP

- ✅ **CRUD operacje** - Tworzenie, odczytywanie, aktualizacja i usuwanie produktów
- ✅ **Lokalne przechowywanie** - SQLite w backendzie + localStorage jako fallback
- ✅ **Podstawowy UI**:
  - Dodawanie produktów (nazwa, kategoria, ilość, cena)
  - Oznaczanie jako kupione
  - Usuwanie produktów
  - Czyszczenie całej listy
- ✅ **AI Sugestie Produktów** 🤖:
  - Analiza historii zakupów (ostatnie 60 dni)
  - Sugestie produktów regularnych (kupowanych często)
  - Przypomnienia o produktach niekupionych od dłuższego czasu
  - Sugestie produktów z tej samej kategorii
  - Produkty często kupowane razem (komplementarne)

## Technologie

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Baza danych**: SQLite
- **Lokalne przechowywanie**: localStorage (fallback)

## Wymagania wstępne

Przed uruchomieniem aplikacji upewnij się, że masz zainstalowane:

- **Node.js** (wersja 16 lub nowsza)
- **npm** (zazwyczaj instalowany razem z Node.js)

### Sprawdź czy masz Node.js

```bash
node --version
npm --version
```

Jeśli nie masz Node.js, zainstaluj go:

**Na macOS (używając Homebrew):**
```bash
brew install node
```

**Lub pobierz z oficjalnej strony:**
- Odwiedź: https://nodejs.org/
- Pobierz wersję LTS (Long Term Support)
- Zainstaluj pobrany plik

## Instalacja i uruchomienie

### Krok 1: Sklonuj repozytorium (jeśli jeszcze tego nie zrobiłeś)

```bash
cd /Users/justynapie/Repos/Shopping-list
```

### Krok 2: Zainstaluj wszystkie zależności

```bash
npm run install-all
```

To zainstaluje zależności dla:
- Głównego projektu (root)
- Backendu (server)
- Frontendu (client)

**Alternatywnie, możesz zainstalować ręcznie:**

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Krok 3: Uruchom aplikację

```bash
npm run dev
```

To uruchomi jednocześnie:
- **Backend** na `http://localhost:3001`
- **Frontend** na `http://localhost:3000`

Aplikacja automatycznie otworzy się w przeglądarce. Jeśli nie, otwórz ręcznie:

```
http://localhost:3000
```

### Krok 4: Użyj aplikacji

1. Dodaj produkty do listy zakupów używając formularza
2. Oznacz produkty jako kupione klikając checkbox
3. Usuń produkty klikając ikonę kosza
4. Wyczyść całą listę używając przycisku "Wyczyść wszystko"

## Alternatywne sposoby uruchomienia

### Uruchomienie osobno (backend i frontend w osobnych terminalach)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### Tylko backend (bez frontendu)

```bash
cd server
npm start
```

Backend będzie dostępny na `http://localhost:3001`

### Tylko frontend (wymaga działającego backendu)

```bash
cd client
npm start
```

Frontend będzie dostępny na `http://localhost:3000`

## Rozwiązywanie problemów

### Porty są zajęte

Jeśli porty 3000 lub 3001 są zajęte:

**Zmiana portu backendu:**
Edytuj `server/index.js` i zmień:
```javascript
const PORT = process.env.PORT || 3001; // Zmień na inny port, np. 3002
```

**Zmiana portu frontendu:**
Utwórz plik `.env` w katalogu `client/`:
```
PORT=3002
```

### Błędy podczas instalacji

Jeśli napotkasz błędy podczas `npm install`:

1. Usuń foldery `node_modules`:
```bash
rm -rf node_modules client/node_modules server/node_modules
```

2. Usuń pliki lock:
```bash
rm -f package-lock.json client/package-lock.json server/package-lock.json
```

3. Zainstaluj ponownie:
```bash
npm run install-all
```

### Backend nie uruchamia się

- Sprawdź czy port 3001 jest wolny
- Sprawdź logi w terminalu
- Upewnij się, że wszystkie zależności są zainstalowane: `cd server && npm install`

### Frontend nie łączy się z backendem

- Upewnij się, że backend działa na `http://localhost:3001`
- Sprawdź czy w `client/src/services/api.js` jest poprawny URL API
- Aplikacja automatycznie przełączy się na localStorage jeśli backend jest niedostępny

## Struktura projektu

```
Shopping-list/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Komponenty React
│   │   ├── services/      # API i localStorage
│   │   └── App.js
│   └── package.json
├── server/                # Backend Node.js
│   ├── index.js          # Główny plik serwera
│   └── package.json
└── package.json          # Root package.json
```

## API Endpoints

- `GET /api/items` - Pobierz wszystkie produkty
- `GET /api/items/:id` - Pobierz pojedynczy produkt
- `POST /api/items` - Dodaj nowy produkt
- `PUT /api/items/:id` - Zaktualizuj produkt
- `DELETE /api/items/:id` - Usuń produkt
- `DELETE /api/items` - Usuń wszystkie produkty
- `POST /api/ai/suggestions` - Pobierz sugestie AI produktów
- `GET /api/health` - Status serwera

## Funkcje

### Dodawanie produktów
- Nazwa produktu (wymagane)
- Kategoria (opcjonalne)
- Ilość (domyślnie 1)
- Cena (opcjonalne)

### Zarządzanie listą
- Oznaczanie produktów jako kupione/niekupione
- Usuwanie pojedynczych produktów
- Czyszczenie całej listy
- Automatyczne grupowanie: "Do kupienia" i "Kupione"

### AI Sugestie Produktów
- **Automatyczna analiza**: System analizuje historię zakupów i uczy się z Twoich wzorców
- **Sugestie regularne**: Produkty kupowane często (>3 razy w miesiącu)
- **Przypomnienia**: Produkty niekupione od >7 dni (jeśli były regularne)
- **Kategorie**: Gdy dodajesz produkt z kategorii, sugeruje inne popularne produkty z tej kategorii
- **Komplementarne**: Produkty często kupowane razem z produktami na Twojej liście
- **Działanie offline**: Wszystkie analizy wykonywane lokalnie, bez wysyłania danych na zewnątrz

### Przechowywanie danych
- Backend używa SQLite do trwałego przechowywania
- Frontend automatycznie synchronizuje z localStorage jako backup
- Jeśli backend jest niedostępny, aplikacja działa w trybie offline z localStorage

## Rozwój

### Uruchomienie tylko backendu
```bash
cd server
npm run dev
```

### Uruchomienie tylko frontendu
```bash
cd client
npm start
```

### Build produkcyjny
```bash
cd client
npm run build
```

## Następne kroki (zgodnie z ProgressionPhases.txt)

- **Phase 1**: Natural-language entry, smart autocomplete, auto-categorization
- **Phase 2**: Recipe-to-shopping-list, personalization, voice input
- **Phase 3**: Price comparison, pantry tracking, offline-first sync

## Licencja

ISC
