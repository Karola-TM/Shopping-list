// Lista najpopularniejszych kategorii produktów
export const CATEGORIES = [
  'Nabiał',
  'Warzywa',
  'Owoce',
  'Mięso i wędliny',
  'Pieczywo',
  'Napoje',
  'Słodycze',
  'Przyprawy',
  'Chemia gospodarcza',
  'Kosmetyki',
  'Środki czystości',
  'Inne'
];

// Funkcja pomocnicza do grupowania produktów według kategorii
export const groupItemsByCategory = (items) => {
  const grouped = {};
  
  items.forEach(item => {
    const category = item.category || 'Inne';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  
  // Sortowanie kategorii - "Inne" zawsze na końcu
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Inne') return 1;
    if (b === 'Inne') return -1;
    return a.localeCompare(b, 'pl');
  });
  
  return sortedCategories.map(category => ({
    category,
    items: grouped[category]
  }));
};

