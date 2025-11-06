import React, { useState } from 'react';
import './AddItemForm.css';

const AddItemForm = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Proszę podać nazwę produktu');
      return;
    }

    onAdd({
      name: name.trim(),
      category: category.trim() || null,
      quantity: parseInt(quantity) || 1,
      price: price ? parseFloat(price) : null
    });

    // Reset form
    setName('');
    setCategory('');
    setQuantity(1);
    setPrice('');
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Nazwa produktu *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Mleko"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Kategoria</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="np. Nabiał"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">Ilość</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Cena (zł)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
      </div>

      <button type="submit" className="add-button">
        ➕ Dodaj produkt
      </button>
    </form>
  );
};

export default AddItemForm;

