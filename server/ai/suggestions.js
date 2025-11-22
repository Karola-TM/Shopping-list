/**
 * Moduł AI do generowania sugestii produktów na podstawie historii zakupów
 */

/**
 * Oblicza częstotliwość zakupów każdego produktu
 */
function calculateFrequency(history) {
  const frequency = {};
  
  history.forEach(item => {
    const name = item.name.toLowerCase().trim();
    if (!frequency[name]) {
      frequency[name] = {
        count: 0,
        category: item.category || 'Inne',
        lastPurchase: null,
        purchases: []
      };
    }
    frequency[name].count++;
    
    if (item.bought_date) {
      const purchaseDate = new Date(item.bought_date);
      frequency[name].purchases.push(purchaseDate);
      if (!frequency[name].lastPurchase || purchaseDate > frequency[name].lastPurchase) {
        frequency[name].lastPurchase = purchaseDate;
      }
    }
  });
  
  return frequency;
}

/**
 * Znajduje produkty często kupowane razem
 */
function findComplementaryItems(history, currentItems) {
  const currentItemNames = currentItems.map(item => item.name.toLowerCase().trim());
  const itemPairs = {};
  
  // Grupuj zakupy według daty (produkty kupione tego samego dnia)
  const purchasesByDate = {};
  history.forEach(item => {
    if (item.bought_date) {
      const date = item.bought_date.split('T')[0]; // tylko data bez czasu
      if (!purchasesByDate[date]) {
        purchasesByDate[date] = [];
      }
      purchasesByDate[date].push(item.name.toLowerCase().trim());
    }
  });
  
  // Znajdź pary produktów często kupowanych razem
  Object.values(purchasesByDate).forEach(items => {
    items.forEach(item1 => {
      items.forEach(item2 => {
        if (item1 !== item2) {
          const pair = [item1, item2].sort().join('|');
          if (!itemPairs[pair]) {
            itemPairs[pair] = 0;
          }
          itemPairs[pair]++;
        }
      });
    });
  });
  
  // Znajdź produkty komplementarne do aktualnej listy
  const complementary = {};
  Object.keys(itemPairs).forEach(pair => {
    const [item1, item2] = pair.split('|');
    if (currentItemNames.includes(item1) && !currentItemNames.includes(item2)) {
      if (!complementary[item2] || itemPairs[pair] > complementary[item2].score) {
        complementary[item2] = {
          name: item2,
          score: itemPairs[pair],
          pairedWith: item1
        };
      }
    }
    if (currentItemNames.includes(item2) && !currentItemNames.includes(item1)) {
      if (!complementary[item1] || itemPairs[pair] > complementary[item1].score) {
        complementary[item1] = {
          name: item1,
          score: itemPairs[pair],
          pairedWith: item2
        };
      }
    }
  });
  
  return Object.values(complementary)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Generuje sugestie na podstawie kategorii
 */
function getCategorySuggestions(history, currentItems) {
  const currentCategories = {};
  currentItems.forEach(item => {
    const cat = item.category || 'Inne';
    if (!currentCategories[cat]) {
      currentCategories[cat] = new Set();
    }
    currentCategories[cat].add(item.name.toLowerCase().trim());
  });
  
  const categoryFrequency = {};
  history.forEach(item => {
    const cat = item.category || 'Inne';
    const name = item.name.toLowerCase().trim();
    
    if (!categoryFrequency[cat]) {
      categoryFrequency[cat] = {};
    }
    if (!categoryFrequency[cat][name]) {
      categoryFrequency[cat][name] = 0;
    }
    categoryFrequency[cat][name]++;
  });
  
  const suggestions = [];
  Object.keys(currentCategories).forEach(cat => {
    if (categoryFrequency[cat]) {
      const topItems = Object.entries(categoryFrequency[cat])
        .filter(([name]) => !currentCategories[cat].has(name))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          category: cat,
          reason: `Często kupowane w kategorii ${cat}`,
          score: count
        }));
      suggestions.push(...topItems);
    }
  });
  
  return suggestions.slice(0, 5);
}

/**
 * Główna funkcja generująca sugestie
 */
function generateSuggestions(history, currentItems) {
  if (!history || history.length === 0) {
    return {
      suggestions: [],
      regular: [],
      overdue: [],
      category: [],
      complementary: []
    };
  }
  
  const frequency = calculateFrequency(history);
  const currentItemNames = currentItems.map(item => item.name.toLowerCase().trim());
  const now = new Date();
  
  // 1. Regularne produkty (kupowane >= 3 razy, nie ma na liście)
  const regularItems = Object.entries(frequency)
    .filter(([name, data]) => {
      return data.count >= 3 && !currentItemNames.includes(name);
    })
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category: data.category,
      reason: `Kupowane regularnie (${data.count} razy)`,
      score: data.count,
      lastPurchase: data.lastPurchase
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  // 2. Produkty przeterminowane (nie kupowane >7 dni, były regularne)
  const overdueItems = Object.entries(frequency)
    .filter(([name, data]) => {
      if (currentItemNames.includes(name) || !data.lastPurchase) return false;
      
      const daysSince = (now - data.lastPurchase) / (1000 * 60 * 60 * 24);
      return daysSince > 7 && data.count >= 2;
    })
    .map(([name, data]) => {
      const daysSince = Math.floor((now - data.lastPurchase) / (1000 * 60 * 60 * 24));
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        category: data.category,
        reason: `Ostatnio kupowane ${daysSince} dni temu`,
        score: data.count,
        daysSince
      };
    })
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5);
  
  // 3. Sugestie kategorii
  const categorySuggestions = getCategorySuggestions(history, currentItems);
  
  // 4. Produkty komplementarne
  const complementaryItems = findComplementaryItems(history, currentItems)
    .map(item => ({
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      reason: `Często kupowane razem z ${item.pairedWith}`,
      score: item.score
    }));
  
  // Połącz wszystkie sugestie i usuń duplikaty
  const allSuggestions = [
    ...regularItems.map(item => ({ ...item, type: 'regular' })),
    ...overdueItems.map(item => ({ ...item, type: 'overdue' })),
    ...categorySuggestions.map(item => ({ ...item, type: 'category' })),
    ...complementaryItems.map(item => ({ ...item, type: 'complementary' }))
  ];
  
  // Usuń duplikaty (te same nazwy produktów)
  const uniqueSuggestions = [];
  const seen = new Set();
  
  allSuggestions.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSuggestions.push(item);
    }
  });
  
  // Sortuj według score i zwróć top 10
  uniqueSuggestions.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return {
    suggestions: uniqueSuggestions.slice(0, 10),
    regular: regularItems,
    overdue: overdueItems,
    category: categorySuggestions,
    complementary: complementaryItems
  };
}

module.exports = {
  generateSuggestions,
  calculateFrequency,
  findComplementaryItems,
  getCategorySuggestions
};

