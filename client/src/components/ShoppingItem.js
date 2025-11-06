import React, { useState, useEffect } from 'react';
import './ShoppingItem.css';
import { CATEGORIES } from '../utils/categories';

const ShoppingItem = ({ item, onToggleBought, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedCategory, setEditedCategory] = useState(item.category || 'Inne');

  // Synchronize local state when item prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditedName(item.name);
      setEditedCategory(item.category || 'Inne');
    }
  }, [item.name, item.category, isEditing]);

  const handleToggle = () => {
    onToggleBought(item.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Czy na pewno chcesz usunąć "${item.name}"?`)) {
      onDelete(item.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(item.name);
    setEditedCategory(item.category || 'Inne');
  };

  const handleSave = () => {
    if (!editedName.trim()) {
      alert('Proszę podać nazwę produktu');
      return;
    }

    onEdit(item.id, {
      name: editedName.trim(),
      category: editedCategory || 'Inne'
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(item.name);
    setEditedCategory(item.category || 'Inne');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`shopping-item editing ${item.bought === 1 ? 'bought' : ''}`}>
        <div className="item-content">
          <div className="item-info">
            <input
              type="text"
              className="edit-name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nazwa produktu"
              autoFocus
            />
            <select
              className="edit-category-select"
              value={editedCategory}
              onChange={(e) => setEditedCategory(e.target.value)}
              onKeyDown={handleKeyDown}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="edit-actions">
          <button
            className="save-button"
            onClick={handleSave}
            aria-label="Zapisz zmiany"
          >
            ✓
          </button>
          <button
            className="cancel-button"
            onClick={handleCancel}
            aria-label="Anuluj"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`shopping-item ${item.bought === 1 ? 'bought' : ''}`}>
      <div className="item-content">
        <button
          className={`checkbox ${item.bought === 1 ? 'checked' : ''}`}
          onClick={handleToggle}
          aria-label={item.bought === 1 ? 'Oznacz jako niekupione' : 'Oznacz jako kupione'}
        >
          {item.bought === 1 && '✓'}
        </button>

        <div className="item-info">
          <div className="item-name">{item.name}</div>
          <div className="item-details">
            {item.quantity > 1 && (
              <span className="item-quantity">x{item.quantity}</span>
            )}
            {item.price && (
              <span className="item-price">{item.price.toFixed(2)} zł</span>
            )}
          </div>
        </div>
      </div>

      <div className="item-actions">
        <button
          className="edit-button"
          onClick={handleEdit}
          aria-label="Edytuj produkt"
        >
          ✏️
        </button>
        <button
          className="delete-button"
          onClick={handleDelete}
          aria-label="Usuń produkt"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ShoppingItem;

