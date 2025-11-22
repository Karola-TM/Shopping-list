const { generateSuggestions, calculateFrequency, findComplementaryItems, getCategorySuggestions } = require('./suggestions');

describe('AI Suggestions Module', () => {
  describe('calculateFrequency', () => {
    test('powinien obliczyć częstotliwość zakupów produktów', () => {
      const history = [
        { name: 'Mleko', category: 'Nabiał', bought_date: '2024-01-01T10:00:00Z' },
        { name: 'Mleko', category: 'Nabiał', bought_date: '2024-01-08T10:00:00Z' },
        { name: 'Mleko', category: 'Nabiał', bought_date: '2024-01-15T10:00:00Z' },
        { name: 'Chleb', category: 'Pieczywo', bought_date: '2024-01-05T10:00:00Z' },
        { name: 'Chleb', category: 'Pieczywo', bought_date: '2024-01-12T10:00:00Z' },
      ];

      const frequency = calculateFrequency(history);

      expect(frequency['mleko'].count).toBe(3);
      expect(frequency['chleb'].count).toBe(2);
      expect(frequency['mleko'].category).toBe('Nabiał');
    });
  });

  describe('findComplementaryItems', () => {
    test('powinien znaleźć produkty często kupowane razem', () => {
      const history = [
        { name: 'Mleko', bought_date: '2024-01-01T10:00:00Z' },
        { name: 'Chleb', bought_date: '2024-01-01T10:00:00Z' },
        { name: 'Mleko', bought_date: '2024-01-08T10:00:00Z' },
        { name: 'Chleb', bought_date: '2024-01-08T10:00:00Z' },
        { name: 'Jajka', bought_date: '2024-01-08T10:00:00Z' },
      ];

      const currentItems = [{ name: 'Mleko' }];
      const complementary = findComplementaryItems(history, currentItems);

      expect(complementary.length).toBeGreaterThan(0);
      expect(complementary.some(item => item.name === 'chleb')).toBe(true);
    });
  });

  describe('getCategorySuggestions', () => {
    test('powinien sugerować produkty z tej samej kategorii', () => {
      const history = [
        { name: 'Mleko', category: 'Nabiał' },
        { name: 'Ser', category: 'Nabiał' },
        { name: 'Jogurt', category: 'Nabiał' },
        { name: 'Chleb', category: 'Pieczywo' },
      ];

      const currentItems = [{ name: 'Mleko', category: 'Nabiał' }];
      const suggestions = getCategorySuggestions(history, currentItems);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.name === 'ser' || s.name === 'jogurt')).toBe(true);
    });
  });

  describe('generateSuggestions', () => {
    test('powinien zwrócić puste sugestie dla pustej historii', () => {
      const result = generateSuggestions([], []);

      expect(result.suggestions).toEqual([]);
      expect(result.regular).toEqual([]);
      expect(result.overdue).toEqual([]);
      expect(result.category).toEqual([]);
      expect(result.complementary).toEqual([]);
    });

    test('powinien generować sugestie regularnych produktów', () => {
      const now = new Date();
      const history = [];
      
      // Tworzymy historię z produktami kupowanymi regularnie
      for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7)); // Co tydzień
        history.push({
          name: 'Mleko',
          category: 'Nabiał',
          bought_date: date.toISOString()
        });
      }

      const result = generateSuggestions(history, []);

      expect(result.regular.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('powinien generować sugestie przeterminowanych produktów', () => {
      const now = new Date();
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const history = [
        { name: 'Mleko', category: 'Nabiał', bought_date: eightDaysAgo.toISOString() },
        { name: 'Mleko', category: 'Nabiał', bought_date: new Date(eightDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = generateSuggestions(history, []);

      expect(result.overdue.length).toBeGreaterThan(0);
    });

    test('nie powinien sugerować produktów już na liście', () => {
      const history = [
        { name: 'Mleko', category: 'Nabiał', bought_date: new Date().toISOString() },
        { name: 'Mleko', category: 'Nabiał', bought_date: new Date().toISOString() },
        { name: 'Mleko', category: 'Nabiał', bought_date: new Date().toISOString() },
      ];

      const currentItems = [{ name: 'Mleko' }];
      const result = generateSuggestions(history, currentItems);

      // Mleko nie powinno być w sugestiach, bo już jest na liście
      const hasMilk = result.suggestions.some(s => 
        s.name.toLowerCase() === 'mleko'
      );
      expect(hasMilk).toBe(false);
    });
  });
});

