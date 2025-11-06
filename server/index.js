const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { generateSuggestions } = require('./ai/suggestions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'shopping_list.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    price REAL,
    bought INTEGER DEFAULT 0,
    bought_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add bought_date column if it doesn't exist (migration)
  db.run(`ALTER TABLE items ADD COLUMN bought_date DATETIME`, (err) => {
    // Ignore error if column already exists
  });
});

// Routes

// GET all items
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY bought ASC, created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(row);
  });
});

// POST create new item
app.post('/api/items', (req, res) => {
  const { name, category, quantity, price } = req.body;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  // Ustaw domyślną kategorię "Inne" jeśli nie podano
  const itemCategory = category && category.trim() ? category.trim() : 'Inne';

  db.run(
    'INSERT INTO items (name, category, quantity, price) VALUES (?, ?, ?, ?)',
    [name.trim(), itemCategory, quantity || 1, price || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const { name, category, quantity, price, bought } = req.body;

  // Set bought_date when marking as bought
  const boughtDate = bought === 1 ? new Date().toISOString() : null;

  db.run(
    'UPDATE items SET name = ?, category = ?, quantity = ?, price = ?, bought = ?, bought_date = ? WHERE id = ?',
    [name, category, quantity, price, bought !== undefined ? bought : 0, boughtDate, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json({ message: 'Item deleted successfully' });
  });
});

// DELETE all items
app.delete('/api/items', (req, res) => {
  db.run('DELETE FROM items', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'All items deleted successfully', count: this.changes });
  });
});

// AI Suggestions endpoint
app.post('/api/ai/suggestions', (req, res) => {
  const { currentItems = [] } = req.body;
  
  // Pobierz historię zakupów (produkty oznaczone jako kupione)
  // Uwzględnij ostatnie 60 dni historii
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 60);
  
  db.all(
    `SELECT * FROM items 
     WHERE bought = 1 AND bought_date IS NOT NULL 
     AND bought_date >= datetime('now', '-60 days')
     ORDER BY bought_date DESC`,
    [],
    (err, history) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      try {
        const suggestions = generateSuggestions(history, currentItems);
        res.json(suggestions);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
      }
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

