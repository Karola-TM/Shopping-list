import React from 'react';
import './ShoppingItem.css';

const ShoppingItem = ({ item, onToggleBought, onDelete }) => {
  const handleToggle = () => {
    onToggleBought(item.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Czy na pewno chcesz usunąć "${item.name}"?`)) {
      onDelete(item.id);
    }
  };

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
            {item.category && (
              <span className="item-category">{item.category}</span>
            )}
            {item.quantity > 1 && (
              <span className="item-quantity">x{item.quantity}</span>
            )}
            {item.price && (
              <span className="item-price">{item.price.toFixed(2)} zł</span>
            )}
          </div>
        </div>
      </div>

      <button
        className="delete-button"
        onClick={handleDelete}
        aria-label="Usuń produkt"
      >
        🗑️
      </button>
    </div>
  );
};

export default ShoppingItem;

