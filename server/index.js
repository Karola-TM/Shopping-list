const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateSuggestions } = require('./ai/suggestions');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'shopping_list.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create items table
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    price REAL,
    bought INTEGER DEFAULT 0,
    bought_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  
  // Add user_id column if it doesn't exist (migration)
  db.run(`ALTER TABLE items ADD COLUMN user_id INTEGER`, (err) => {
    // Ignore error if column already exists
  });

  // Add bought_date column if it doesn't exist (migration)
  db.run(`ALTER TABLE items ADD COLUMN bought_date DATETIME`, (err) => {
    // Ignore error if column already exists
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// POST register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Generate JWT token
          const token = jwt.sign(
            { id: this.lastID, username, email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: this.lastID, username, email }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST login user
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during login' });
    }
  });
});

// GET verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// GET all items (protected)
app.get('/api/items', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM items WHERE user_id = ? ORDER BY bought ASC, created_at DESC', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single item (protected)
app.get('/api/items/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
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

// POST create new item (protected)
app.post('/api/items', authenticateToken, (req, res) => {
  const { name, category, quantity, price } = req.body;
  const userId = req.user.id;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  // Ustaw domyślną kategorię "Inne" jeśli nie podano
  const itemCategory = category && category.trim() ? category.trim() : 'Inne';

  db.run(
    'INSERT INTO items (user_id, name, category, quantity, price) VALUES (?, ?, ?, ?, ?)',
    [userId, name.trim(), itemCategory, quantity || 1, price || null],
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

// PUT update item (protected)
app.put('/api/items/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const { name, category, quantity, price, bought } = req.body;

  // Set bought_date when marking as bought
  const boughtDate = bought === 1 ? new Date().toISOString() : null;

  db.run(
    'UPDATE items SET name = ?, category = ?, quantity = ?, price = ?, bought = ?, bought_date = ? WHERE id = ? AND user_id = ?',
    [name, category, quantity, price, bought !== undefined ? bought : 0, boughtDate, id, userId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

// DELETE item (protected)
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  db.run('DELETE FROM items WHERE id = ? AND user_id = ?', [id, userId], function(err) {
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

// DELETE all items (protected)
app.delete('/api/items', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.run('DELETE FROM items WHERE user_id = ?', [userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'All items deleted successfully', count: this.changes });
  });
});

// AI Suggestions endpoint (protected)
app.post('/api/ai/suggestions', authenticateToken, (req, res) => {
  const { currentItems = [] } = req.body;
  const userId = req.user.id;
  
  // Pobierz historię zakupów (produkty oznaczone jako kupione)
  // Uwzględnij ostatnie 60 dni historii
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 60);
  
  db.all(
    `SELECT * FROM items 
     WHERE user_id = ? AND bought = 1 AND bought_date IS NOT NULL 
     AND bought_date >= datetime('now', '-60 days')
     ORDER BY bought_date DESC`,
    [userId],
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

