# 🚀 Instrukcja Deployment na Render

Ten dokument zawiera instrukcje dotyczące publikacji aplikacji Shopping List na Render (darmowy hosting).

## Dlaczego Render?

- ✅ **Darmowy tier** - Idealny do projektów MVP
- ✅ **Łatwa konfiguracja** - Automatyczny deployment z GitHuba
- ✅ **Obsługa Node.js** - Pełne wsparcie dla backendu
- ✅ **Automatyczne SSL** - HTTPS out of the box
- ✅ **Automatyczne deploymenty** - Przy każdym push do repozytorium

## Wymagania wstępne

1. Konto na GitHub (jeśli jeszcze nie masz)
2. Konto na Render (darmowe): https://render.com
3. Repozytorium aplikacji na GitHub

## Krok 1: Przygotowanie repozytorium

Upewnij się, że wszystkie zmiany są zapisane i wypushowane do GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin deploy
```

## Krok 2: Utworzenie konta na Render

1. Przejdź do: https://render.com
2. Kliknij "Get Started for Free"
3. Zaloguj się używając konta GitHub (najłatwiejsze)

## Krok 3: Utworzenie nowego Web Service

1. W dashboardzie Render kliknij "New +"
2. Wybierz "Web Service"
3. Połącz swoje repozytorium GitHub:
   - Jeśli nie widzisz repozytorium, kliknij "Configure account" i autoryzuj dostęp
   - Wybierz repozytorium `Shopping-list`
   - Wybierz branch `deploy`

## Krok 4: Konfiguracja Web Service

Wypełnij następujące pola:

- **Name**: `shopping-list-app` (lub dowolna nazwa)
- **Environment**: `Node`
- **Region**: Wybierz najbliższy (np. Frankfurt dla Europy)
- **Branch**: `deploy`
- **Root Directory**: (zostaw puste)
- **Build Command**: `npm run install-all && cd client && npm run build`
- **Start Command**: `cd server && npm start`

### Zmienne środowiskowe (Environment Variables)

Kliknij "Advanced" i dodaj następujące zmienne:

- `NODE_ENV` = `production`
- `JWT_SECRET` = (kliknij "Generate" aby wygenerować losowy klucz)
- `PORT` = (Render ustawi to automatycznie, nie trzeba dodawać)

## Krok 5: Deployment

1. Kliknij "Create Web Service"
2. Render automatycznie rozpocznie build i deployment
3. Proces może zająć 5-10 minut przy pierwszym deploymentzie
4. Po zakończeniu otrzymasz URL aplikacji (np. `https://shopping-list-app.onrender.com`)

## Krok 6: Weryfikacja

1. Otwórz URL aplikacji w przeglądarce
2. Sprawdź czy aplikacja działa:
   - Spróbuj zarejestrować nowe konto
   - Dodaj produkt do listy
   - Sprawdź czy wszystko działa poprawnie

## Aktualizacje aplikacji

Render automatycznie wykrywa zmiany w repozytorium i uruchamia nowy deployment:

1. Wprowadź zmiany w kodzie
2. Commit i push do brancha `deploy`:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin deploy
   ```
3. Render automatycznie zbuduje i wdroży nową wersję

## Rozwiązywanie problemów

### Build fails

- Sprawdź logi w dashboardzie Render
- Upewnij się, że wszystkie zależności są w `package.json`
- Sprawdź czy build command jest poprawny

### Aplikacja nie uruchamia się

- Sprawdź logi w sekcji "Logs" w dashboardzie
- Upewnij się, że `startCommand` jest poprawny
- Sprawdź czy port jest ustawiony przez Render (zmienna `PORT`)

### Baza danych nie działa

- SQLite działa lokalnie na serwerze Render
- Dane są trwałe między deploymentami
- Jeśli potrzebujesz zresetować bazę, możesz usunąć plik `shopping_list.db` i zrestartować serwis

### Frontend nie łączy się z backendem

- W produkcji frontend i backend są na tym samym domenie
- API jest dostępne pod `/api/*`
- Sprawdź czy `REACT_APP_API_URL` nie jest ustawione (powinno używać względnych ścieżek)

## Limity darmowego tieru

Render Free tier ma następujące limity:

- ⏱️ **Sleep after inactivity**: Aplikacja "zasypia" po 15 minutach bezczynności
- ⏰ **First request delay**: Pierwsze żądanie po "zaśnięciu" może zająć 30-60 sekund
- 💾 **512 MB RAM**: Wystarczające dla tej aplikacji
- 📊 **100 GB bandwidth/month**: Wystarczające dla MVP

**Uwaga**: Jeśli aplikacja "śpi", pierwsze żądanie może być wolne. To normalne dla darmowego tieru.

## Upgrade do płatnego planu

Jeśli potrzebujesz:
- Brak "sleep" (aplikacja zawsze aktywna)
- Więcej zasobów
- Wsparcie priorytetowe

Możesz upgrade'ować do planu Starter ($7/miesiąc).

## Alternatywne hosty

Jeśli Render nie spełnia Twoich potrzeb, możesz rozważyć:

- **Railway** - Bardzo łatwy, $5 kredytu miesięcznie
- **Fly.io** - Darmowy tier, bardziej zaawansowany
- **Heroku** - Popularny, ale już nie ma darmowego tieru

## Wsparcie

Jeśli napotkasz problemy:
1. Sprawdź logi w dashboardzie Render
2. Sprawdź dokumentację Render: https://render.com/docs
3. Sprawdź czy wszystkie zmienne środowiskowe są ustawione

---

**Powodzenia z deploymentem! 🎉**

