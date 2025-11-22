const STORAGE_KEY_PREFIX = 'shopping_list_items';

// Get storage key for specific user
const getStorageKey = (userId) => {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
};

// Clear all localStorage data (for logout)
export const clearAllLocalStorage = () => {
  try {
    // Clear all shopping list items for all users
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all localStorage:', error);
  }
};

export const loadFromLocalStorage = (userId = null) => {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

export const saveToLocalStorage = (items, userId = null) => {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const clearLocalStorage = (userId = null) => {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

