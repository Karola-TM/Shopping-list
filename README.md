# 🛒 Smart Shopping List - MVP

Aplikacja webowa do zarządzania listą zakupów zgodna z wymaganiami MVP.

## Funkcjonalności MVP

- ✅ **CRUD operacje** - Tworzenie, odczytywanie, aktualizacja i usuwanie produktów
- ✅ **Autoryzacja użytkowników** - Rejestracja, logowanie i zarządzanie sesją
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
- ✅ **Testy** - Testy E2E i jednostkowe weryfikujące działanie aplikacji
- ✅ **CI/CD Pipeline** - Automatyczne budowanie i testowanie przy każdym push

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

### Krok 3: Utwórz konto testowe (opcjonalne)

Możesz utworzyć konto testowe, które będzie gotowe do użycia:

```bash
cd server
npm run seed
```

To utworzy konto testowe z następującymi danymi:
- **Username**: `test`
- **Email**: `test@example.com`
- **Password**: `test123`

**Uwaga**: Jeśli konto już istnieje, skrypt poinformuje Cię o tym i nie utworzy duplikatu.

### Krok 4: Uruchom aplikację

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

### Krok 5: Zaloguj się lub zarejestruj

1. **Jeśli masz konto testowe**: Użyj danych z kroku 3
2. **Jeśli chcesz utworzyć nowe konto**: Kliknij "Zarejestruj się" i wypełnij formularz
3. Po zalogowaniu będziesz mógł korzystać z aplikacji

### Krok 6: Użyj aplikacji

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

## Autoryzacja

Aplikacja używa systemu autoryzacji opartego na JWT (JSON Web Tokens). Wszystkie operacje na produktach wymagają zalogowania.

### Rejestracja użytkownika

Aby utworzyć nowe konto:
1. Kliknij "Zarejestruj się" na ekranie logowania
2. Wypełnij formularz:
   - **Nazwa użytkownika** (wymagane, unikalne)
   - **Email** (wymagane, unikalne)
   - **Hasło** (wymagane, minimum 6 znaków)
   - **Potwierdź hasło** (wymagane)
3. Po rejestracji automatycznie zostaniesz zalogowany

### Logowanie

Aby zalogować się do istniejącego konta:
1. Wprowadź nazwę użytkownika lub email
2. Wprowadź hasło
3. Kliknij "Zaloguj się"

### Konto testowe

Dla szybkiego testowania aplikacji możesz użyć konta testowego:

**Dane logowania:**
- **Username**: `test`
- **Email**: `test@example.com`
- **Password**: `test123`

Aby utworzyć konto testowe, uruchom:
```bash
cd server
npm run seed
```

### Bezpieczeństwo

- Hasła są hashowane przy użyciu bcrypt (10 rund)
- Tokeny JWT są ważne przez 7 dni
- Każdy użytkownik widzi tylko swoje produkty
- Token jest automatycznie dodawany do wszystkich żądań API
- Przy wygaśnięciu tokenu użytkownik jest automatycznie wylogowywany

### Wylogowanie

Kliknij przycisk "Wyloguj" w prawym górnym rogu aplikacji, aby zakończyć sesję.

## API Endpoints

### Endpointy autoryzacji (publiczne)

- `POST /api/auth/register` - Rejestracja nowego użytkownika
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- `POST /api/auth/login` - Logowanie użytkownika
  ```json
  {
    "username": "string (username lub email)",
    "password": "string"
  }
  ```
- `GET /api/auth/verify` - Weryfikacja tokenu (wymaga autoryzacji)

### Endpointy produktów (wymagają autoryzacji)

Wszystkie endpointy produktów wymagają nagłówka `Authorization: Bearer <token>`.

- `GET /api/items` - Pobierz wszystkie produkty użytkownika
- `GET /api/items/:id` - Pobierz pojedynczy produkt użytkownika
- `POST /api/items` - Dodaj nowy produkt
  ```json
  {
    "name": "string (wymagane)",
    "category": "string (opcjonalne)",
    "quantity": "number (opcjonalne, domyślnie 1)",
    "price": "number (opcjonalne)"
  }
  ```
- `PUT /api/items/:id` - Zaktualizuj produkt
- `DELETE /api/items/:id` - Usuń produkt
- `DELETE /api/items` - Usuń wszystkie produkty użytkownika
- `POST /api/ai/suggestions` - Pobierz sugestie AI produktów
  ```json
  {
    "currentItems": "array (opcjonalne)"
  }
  ```

### Inne endpointy

- `GET /api/health` - Status serwera (publiczny)

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
- Każdy użytkownik ma własną listę produktów (izolacja danych)
- Frontend automatycznie synchronizuje z localStorage jako backup
- Jeśli backend jest niedostępny, aplikacja działa w trybie offline z localStorage
- Tokeny JWT są przechowywane w localStorage przeglądarki

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

### Testy

Projekt zawiera testy weryfikujące działanie aplikacji z perspektywy użytkownika oraz testy jednostkowe dla logiki biznesowej.

#### Uruchomienie testów frontendu
```bash
cd client
npm test
```

#### Uruchomienie testów backendu
```bash
cd server
npm test
```

#### Testy E2E (End-to-End)
Testy weryfikują następujące scenariusze użytkownika:
- Logowanie użytkownika
- Dodawanie produktu do listy i wyświetlenie go
- Oznaczanie produktu jako kupiony
- Usuwanie produktu z listy

#### Testy jednostkowe
- Testy modułu AI (analiza historii zakupów, sugestie produktów)
- Testy funkcji pomocniczych

## CI/CD

Projekt zawiera skonfigurowany pipeline CI/CD używający GitHub Actions (`.github/workflows/ci.yml`).

Pipeline automatycznie:
- Buduje aplikację frontendową i backendową
- Uruchamia testy jednostkowe i E2E
- Weryfikuje działanie na różnych wersjach Node.js (18.x, 20.x)

Pipeline uruchamia się automatycznie przy:
- Push do brancha `main` lub `develop`
- Utworzeniu Pull Request do `main` lub `develop`

## Następne kroki (zgodnie z ProgressionPhases.txt)

- **Phase 1**: Natural-language entry, smart autocomplete, auto-categorization
- **Phase 2**: Recipe-to-shopping-list, personalization, voice input
- **Phase 3**: Price comparison, pantry tracking, offline-first sync

## Licencja

ISC
