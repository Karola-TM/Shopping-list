# 🧪 Dokumentacja Testów

## Przegląd

Projekt zawiera testy weryfikujące działanie aplikacji z perspektywy użytkownika oraz testy jednostkowe dla logiki biznesowej.

## Struktura testów

### Testy Frontendu (`client/src/App.test.js`)

Testy E2E weryfikujące działanie aplikacji z perspektywy użytkownika:

1. **Test logowania** - Weryfikuje, że użytkownik może zobaczyć ekran logowania
2. **Test dodawania produktu** - Weryfikuje, że użytkownik może dodać produkt do listy i zobaczyć go na liście
3. **Test oznaczania jako kupiony** - Weryfikuje, że użytkownik może oznaczyć produkt jako kupiony
4. **Test usuwania produktu** - Weryfikuje, że użytkownik może usunąć produkt z listy

### Testy Backendu (`server/ai/suggestions.test.js`)

Testy jednostkowe dla modułu AI:

1. **Test obliczania częstotliwości** - Weryfikuje obliczanie częstotliwości zakupów produktów
2. **Test produktów komplementarnych** - Weryfikuje znajdowanie produktów często kupowanych razem
3. **Test sugestii kategorii** - Weryfikuje sugerowanie produktów z tej samej kategorii
4. **Test generowania sugestii** - Weryfikuje główną funkcję generowania sugestii AI

## Uruchomienie testów

### Frontend

```bash
cd client
npm install  # Jeśli jeszcze nie zainstalowano zależności
npm test
```

Testy uruchamiają się w trybie watch. Aby uruchomić jednorazowo:

```bash
npm test -- --watchAll=false
```

### Backend

```bash
cd server
npm install  # Jeśli jeszcze nie zainstalowano zależności
npm test
```

## Pokrycie testami

Testy weryfikują:
- ✅ Logowanie i autoryzację użytkownika
- ✅ Operacje CRUD na produktach (Create, Read, Update, Delete)
- ✅ Logikę biznesową AI (sugestie produktów)
- ✅ Interakcje użytkownika z interfejsem

## CI/CD

Testy są automatycznie uruchamiane w pipeline CI/CD przy każdym push do repozytorium. Zobacz `.github/workflows/ci.yml` dla szczegółów konfiguracji.

