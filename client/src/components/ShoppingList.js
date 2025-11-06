import React from 'react';
import './ShoppingList.css';
import ShoppingItem from './ShoppingItem';

const ShoppingList = ({ items, onToggleBought, onDelete, onClear }) => {
  const boughtItems = items.filter(item => item.bought === 1);
  const activeItems = items.filter(item => item.bought === 0);

  if (items.length === 0) {
    return (
      <div className="shopping-list">
        <div className="empty-state">
          <p>📝 Twoja lista zakupów jest pusta</p>
          <p className="empty-hint">Dodaj pierwszy produkt powyżej!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-list">
      <div className="list-header">
        <h2>
          Lista ({activeItems.length} {activeItems.length === 1 ? 'produkt' : 'produktów'})
        </h2>
        {items.length > 0 && (
          <button className="clear-button" onClick={onClear}>
            🗑️ Wyczyść wszystko
          </button>
        )}
      </div>

      {activeItems.length > 0 && (
        <div className="items-section">
          <h3 className="section-title">Do kupienia</h3>
          <div className="items-list">
            {activeItems.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggleBought={onToggleBought}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {boughtItems.length > 0 && (
        <div className="items-section">
          <h3 className="section-title">Kupione</h3>
          <div className="items-list bought">
            {boughtItems.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggleBought={onToggleBought}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;

