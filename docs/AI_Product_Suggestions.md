# 🤖 Funkcja AI Proponowania Produktów - Koncepcja i Implementacja

## 📋 Przegląd

Funkcja AI proponowania produktów analizuje historię zakupów użytkownika i sugeruje produkty, które mogą być potrzebne. System uczy się z wzorców zakupowych i przewiduje przyszłe potrzeby.

## 🎯 Główne Scenariusze Użycia

### 1. **Sugestie na podstawie częstotliwości zakupów**
- AI analizuje, które produkty były kupowane regularnie (np. co tydzień)
- Sugeruje produkty, które nie były dodane od określonego czasu
- Przykład: "Ostatnio kupiłeś mleko 7 dni temu - czy chcesz dodać je ponownie?"

### 2. **Sugestie na podstawie kategorii**
- Gdy użytkownik dodaje produkty z określonej kategorii, AI sugeruje inne popularne produkty z tej kategorii
- Przykład: Dodając "Pomidory", system sugeruje "Ogórki", "Papryka", "Cebula"

### 3. **Sugestie na podstawie wzorców czasowych**
- Analiza zakupów w określone dni tygodnia/miesiąca
- Przykład: Jeśli zawsze kupujesz pieczywo w poniedziałki, system przypomni o tym

### 4. **Sugestie komplementarne**
- Produkty często kupowane razem
- Przykład: "Mleko" → sugeruje "Płatki śniadaniowe", "Kawa"

## 🏗️ Architektura Rozwiązania

### Opcja 1: Proste podejście oparte na regułach (MVP)

**Zalety:**
- Szybka implementacja
- Nie wymaga zewnętrznych API
- Działa offline
- Niskie koszty

**Jak działa:**
1. Analiza historii zakupów z bazy danych
2. Obliczenie częstotliwości każdego produktu
3. Identyfikacja produktów często kupowanych razem
4. Sugestie na podstawie prostych reguł

**Przykładowe reguły:**
- Jeśli produkt był kupowany >3 razy w ostatnim miesiącu → sugeruj
- Jeśli produkt nie był kupowany przez >7 dni i był regularny → sugeruj
- Jeśli dodano produkt z kategorii X → sugeruj top 3 produkty z tej kategorii

### Opcja 2: Integracja z OpenAI API (Zaawansowane)

**Zalety:**
- Bardziej inteligentne sugestie
- Rozumienie kontekstu naturalnego języka
- Możliwość analizy przepisów i tekstów

**Jak działa:**
1. Przygotowanie kontekstu z historii zakupów
2. Wysłanie promptu do OpenAI API
3. Parsowanie odpowiedzi i wyświetlenie sugestii

**Przykładowy prompt:**
```
Na podstawie historii zakupów użytkownika, zaproponuj 5 produktów, które mogą być potrzebne:
Historia: [lista produktów z ostatnich 30 dni]
Aktualna lista: [lista aktualnych produktów]
Kategorie: [dostępne kategorie]

Odpowiedz w formacie JSON z listą produktów z nazwą, kategorią i powodem sugestii.
```

### Opcja 3: Model ML (TensorFlow.js / Hugging Face)

**Zalety:**
- Działa lokalnie (prywatność)
- Możliwość fine-tuningu na danych użytkownika
- Brak kosztów API

**Jak działa:**
1. Trenowanie prostego modelu na historii zakupów
2. Predykcja prawdopodobieństwa potrzebnych produktów
3. Ranking i wyświetlenie top sugestii

## 💻 Implementacja Techniczna

### Backend - Nowy endpoint

```javascript
// server/index.js - nowy endpoint
app.post('/api/ai/suggestions', async (req, res) => {
  const { currentItems, userId } = req.body;
  
  try {
    // Pobierz historię zakupów użytkownika
    const history = await getPurchaseHistory(userId, 30); // ostatnie 30 dni
    
    // Analiza wzorców
    const suggestions = generateSuggestions(history, currentItems);
    
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Funkcje analityczne (proste podejście)

```javascript
// server/ai/suggestions.js

function generateSuggestions(history, currentItems) {
  const suggestions = [];
  
  // 1. Analiza częstotliwości
  const frequency = calculateFrequency(history);
  const regularItems = Object.keys(frequency)
    .filter(item => frequency[item] >= 3) // kupowane >=3 razy
    .filter(item => !currentItems.includes(item)); // nie ma na liście
  
  // 2. Analiza czasu od ostatniego zakupu
  const lastPurchase = getLastPurchaseDates(history);
  const overdueItems = Object.keys(lastPurchase)
    .filter(item => {
      const daysSince = (Date.now() - lastPurchase[item]) / (1000 * 60 * 60 * 24);
      return daysSince > 7 && frequency[item] >= 2; // >7 dni i regularny
    });
  
  // 3. Analiza kategorii
  const categorySuggestions = getCategorySuggestions(history, currentItems);
  
  // 4. Produkty często kupowane razem
  const complementaryItems = findComplementaryItems(history, currentItems);
  
  return {
    regular: regularItems.slice(0, 5),
    overdue: overdueItems.slice(0, 5),
    category: categorySuggestions,
    complementary: complementaryItems.slice(0, 5)
  };
}
```

### Frontend - Komponent sugestii

```javascript
// client/src/components/AISuggestions.js

import React, { useState, useEffect } from 'react';
import './AISuggestions.css';

const AISuggestions = ({ currentItems, onAddSuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadSuggestions();
  }, [currentItems]);
  
  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentItems: currentItems.map(i => i.name) })
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ai-suggestions">
      <h3>💡 Sugestie AI</h3>
      {loading ? (
        <div>Analizowanie historii zakupów...</div>
      ) : (
        <div className="suggestions-list">
          {suggestions.regular?.map((item, idx) => (
            <div key={idx} className="suggestion-item">
              <span>{item.name}</span>
              <button onClick={() => onAddSuggestion(item)}>+</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🎨 Integracja UI/UX

### Miejsce w interfejsie:

1. **Panel boczny** - zawsze widoczny z sugestiami
2. **Sekcja pod formularzem** - sugestie po dodaniu produktu
3. **Przycisk "Sugestie AI"** - rozwijany panel z sugestiami
4. **Autouzupełnianie** - podczas wpisywania nazwy produktu

### Przykładowy design:

```
┌─────────────────────────────────────┐
│  Formularz dodawania produktu       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💡 Sugestie AI                     │
│  ─────────────────────────────────  │
│  ✓ Mleko (kupowane co tydzień)     │ [+]
│  ✓ Chleb (ostatnio 5 dni temu)     │ [+]
│  ✓ Jajka (często z mlekiem)        │ [+]
│                                     │
│  [Pokaż więcej sugestii]            │
└─────────────────────────────────────┘
```

## 📊 Przykładowe Dane do Analizy

### Historia zakupów w bazie danych:

```sql
-- Rozszerzenie tabeli items o tracking historii
ALTER TABLE items ADD COLUMN bought_date DATETIME;
ALTER TABLE items ADD COLUMN user_id INTEGER; -- jeśli multi-user

-- Tabela historii zakupów (opcjonalnie)
CREATE TABLE purchase_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER,
  price REAL,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER
);
```

## 🔄 Przepływ Danych

```
1. Użytkownik otwiera aplikację
   ↓
2. Frontend pobiera aktualną listę zakupów
   ↓
3. Frontend wysyła żądanie do /api/ai/suggestions
   ↓
4. Backend analizuje historię zakupów z SQLite
   ↓
5. Backend generuje sugestie (reguły/ML/API)
   ↓
6. Frontend wyświetla sugestie
   ↓
7. Użytkownik klika "+" na sugestii
   ↓
8. Produkt dodawany do listy (standardowy flow)
```

## 🚀 Plan Implementacji (Kroki)

### Faza 1: Podstawowa analiza (1-2 dni)
- [ ] Rozszerzenie bazy danych o tracking historii
- [ ] Endpoint `/api/ai/suggestions`
- [ ] Proste funkcje analityczne (częstotliwość, czas)
- [ ] Testy jednostkowe

### Faza 2: Frontend (1 dzień)
- [ ] Komponent `AISuggestions`
- [ ] Integracja z `App.js`
- [ ] Stylowanie CSS
- [ ] Obsługa błędów

### Faza 3: Zaawansowane funkcje (opcjonalnie)
- [ ] Analiza produktów komplementarnych
- [ ] Integracja z OpenAI API
- [ ] Personalizacja sugestii
- [ ] Cache sugestii (optymalizacja)

## 💡 Przykładowe Scenariusze

### Scenariusz 1: Regularne zakupy
```
Historia: Mleko kupowane co 7 dni przez ostatnie 2 miesiące
Aktualna lista: [Chleb, Masło]
Sugestia: "Mleko - ostatnio kupione 6 dni temu, regularnie co tydzień"
```

### Scenariusz 2: Kategoria
```
Użytkownik dodaje: "Pomidory" (kategoria: Warzywa)
Historia: Często kupowane razem: Ogórki, Papryka, Cebula
Sugestia: "Czy chcesz dodać: Ogórki, Papryka, Cebula?"
```

### Scenariusz 3: Komplementarne produkty
```
Aktualna lista: [Mąka, Cukier, Jajka]
Historia: Te produkty często kupowane z: Drożdże, Masło
Sugestia: "Wygląda na to, że pieczesz ciasto - dodaj drożdże?"
```

## 🔐 Uwagi dotyczące prywatności

- **Dane lokalne**: Wszystkie dane przechowywane lokalnie (SQLite)
- **Brak zewnętrznych API**: Proste podejście nie wymaga wysyłania danych
- **Opcjonalna integracja**: OpenAI API tylko za zgodą użytkownika
- **Anonimizacja**: Jeśli używamy API, można anonimizować dane przed wysłaniem

## 📈 Metryki sukcesu

- **Współczynnik akceptacji**: % sugestii zaakceptowanych przez użytkownika
- **Czas zaoszczędzony**: Redukcja czasu na dodawanie produktów
- **Użyteczność**: Liczba kliknięć na sugestie vs ręczne dodawanie

## 🎓 Dalsze rozszerzenia

1. **Uczenie maszynowe**: Trenowanie modelu na danych użytkownika
2. **Analiza przepisów**: Parsowanie przepisów i sugerowanie składników
3. **Predykcja sezonowa**: Uwzględnianie pór roku i świąt
4. **Integracja z kalendarzem**: Sugestie na podstawie planowanych wydarzeń
5. **Grupowe listy**: Sugestie dla wielu użytkowników (rodzina)

