import React, { useState, useEffect } from 'react';
import './App.css';
import ShoppingList from './components/ShoppingList';
import AddItemForm from './components/AddItemForm';
import AISuggestions from './components/AISuggestions';
import { getItems, createItem, updateItem, deleteItem, clearAllItems } from './services/api';
import { loadFromLocalStorage, saveToLocalStorage } from './services/localStorage';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useBackend, setUseBackend] = useState(true);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (useBackend) {
        const data = await getItems();
        setItems(data);
        // Sync to localStorage as backup
        saveToLocalStorage(data);
      } else {
        // Fallback to localStorage
        const data = loadFromLocalStorage();
        setItems(data);
      }
    } catch (err) {
      console.error('Error loading items:', err);
      // Fallback to localStorage if backend fails
      const localData = loadFromLocalStorage();
      setItems(localData);
      setUseBackend(false);
      setError('Backend unavailable, using local storage');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      if (useBackend) {
        const newItem = await createItem(itemData);
        setItems([...items, newItem]);
        // Update localStorage
        const updatedItems = [...items, newItem];
        saveToLocalStorage(updatedItems);
      } else {
        // Use localStorage
        const newItem = {
          id: Date.now(),
          ...itemData,
          bought: 0,
          created_at: new Date().toISOString()
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
      }
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
    }
  };

  const handleToggleBought = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updatedItem = { ...item, bought: item.bought === 1 ? 0 : 1 };

    try {
      if (useBackend) {
        await updateItem(id, updatedItem);
        setItems(items.map(i => i.id === id ? updatedItem : i));
        saveToLocalStorage(items.map(i => i.id === id ? updatedItem : i));
      } else {
        const updatedItems = items.map(i => i.id === id ? updatedItem : i);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      if (useBackend) {
        await deleteItem(id);
        const updatedItems = items.filter(i => i.id !== id);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
      } else {
        const updatedItems = items.filter(i => i.id !== id);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const handleEditItem = async (id, updatedData) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updatedItem = { ...item, ...updatedData };

    try {
      if (useBackend) {
        const savedItem = await updateItem(id, updatedItem);
        setItems(items.map(i => i.id === id ? savedItem : i));
        saveToLocalStorage(items.map(i => i.id === id ? savedItem : i));
      } else {
        const updatedItems = items.map(i => i.id === id ? updatedItem : i);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
      }
    } catch (err) {
      console.error('Error editing item:', err);
      setError('Failed to edit item');
    }
  };

  const handleClearList = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć wszystkie produkty?')) {
      return;
    }

    try {
      if (useBackend) {
        await clearAllItems();
        setItems([]);
        saveToLocalStorage([]);
      } else {
        setItems([]);
        saveToLocalStorage([]);
      }
    } catch (err) {
      console.error('Error clearing list:', err);
      setError('Failed to clear list');
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🛒 Lista Zakupów</h1>
          {error && <div className="error-banner">{error}</div>}
          {!useBackend && (
            <div className="info-banner">
              ⚠️ Tryb offline - dane zapisywane lokalnie
            </div>
          )}
        </header>

        <AddItemForm onAdd={handleAddItem} />

        {!loading && (
          <AISuggestions 
            currentItems={items.filter(item => item.bought === 0)} 
            onAddSuggestion={handleAddItem}
          />
        )}

        {loading ? (
          <div className="loading">Ładowanie...</div>
        ) : (
          <ShoppingList
            items={items}
            onToggleBought={handleToggleBought}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
            onClear={handleClearList}
          />
        )}
      </div>
    </div>
  );
}

export default App;

