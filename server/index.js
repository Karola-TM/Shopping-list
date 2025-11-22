const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { generateSuggestions } = require('./ai/suggestions');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Shopping List API Documentation'
}));

// Initialize database
(async () => {
  try {
    await db.initialize();
    
    // Create test user if it doesn't exist
    const testUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', ['test', 'test@example.com']);
    if (!testUser) {
      try {
        const hashedPassword = await bcrypt.hash('test123', 10);
        const result = await db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          ['test', 'test@example.com', hashedPassword]
        );
        console.log('✅ Test user created: test / test123');
      } catch (error) {
        console.error('Error creating test user:', error);
      }
    } else {
      console.log('✅ Test user already exists: test / test123');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
})();

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Użytkownik został zarejestrowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Błąd walidacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const userId = result.lastID || (result.rows && result.rows[0]?.id) || (await db.get('SELECT id FROM users WHERE username = ?', [username])).id;

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Logowanie udane
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Brakuje wymaganych pól
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Niepoprawne dane logowania
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST login user
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user) {
      console.log(`Login attempt failed: user not found for username/email: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`Login attempt failed: invalid password for user: ${user.username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login successful for user: ${user.username}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Weryfikacja tokenu JWT
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token jest poprawny
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Brak tokena
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Niepoprawny lub wygasły token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Pobierz wszystkie produkty użytkownika
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista produktów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET all items (protected)
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await db.all('SELECT * FROM items WHERE user_id = ? ORDER BY bought ASC, created_at DESC', [userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Pobierz pojedynczy produkt
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produktu
 *     responses:
 *       200:
 *         description: Szczegóły produktu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Produkt nie został znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET single item (protected)
app.get('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const row = await db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, userId]);
    if (!row) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Dodaj nowy produkt
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemRequest'
 *     responses:
 *       201:
 *         description: Produkt został utworzony
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Błąd walidacji (brakuje nazwy)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST create new item (protected)
app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Ustaw domyślną kategorię "Inne" jeśli nie podano
    const itemCategory = category && category.trim() ? category.trim() : 'Inne';

    const result = await db.run(
      'INSERT INTO items (user_id, name, category, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), itemCategory, quantity || 1, price || null]
    );

    const itemId = result.lastID || (result.rows && result.rows[0]?.id) || (await db.get('SELECT id FROM items WHERE user_id = ? AND name = ? ORDER BY id DESC LIMIT 1', [userId, name.trim()])).id;
    const row = await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Zaktualizuj produkt
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produktu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemUpdateRequest'
 *     responses:
 *       200:
 *         description: Produkt został zaktualizowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Produkt nie został znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT update item (protected)
app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const { name, category, quantity, price, bought } = req.body;

    // Set bought_date when marking as bought
    const boughtDate = bought === 1 ? new Date().toISOString() : null;

    const result = await db.run(
      'UPDATE items SET name = ?, category = ?, quantity = ?, price = ?, bought = ?, bought_date = ? WHERE id = ? AND user_id = ?',
      [name, category, quantity, price, bought !== undefined ? bought : 0, boughtDate, id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const row = await db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, userId]);
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Usuń produkt
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produktu
 *     responses:
 *       200:
 *         description: Produkt został usunięty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       404:
 *         description: Produkt nie został znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE item (protected)
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const result = await db.run('DELETE FROM items WHERE id = ? AND user_id = ?', [id, userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/items:
 *   delete:
 *     summary: Usuń wszystkie produkty użytkownika
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wszystkie produkty zostały usunięte
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Liczba usuniętych produktów
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE all items (protected)
app.delete('/api/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.run('DELETE FROM items WHERE user_id = ?', [userId]);
    res.json({ message: 'All items deleted successfully', count: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     summary: Pobierz sugestie AI produktów na podstawie historii zakupów
 *     tags: [AI Suggestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AISuggestionsRequest'
 *     responses:
 *       200:
 *         description: Lista sugestii produktów
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AISuggestionsResponse'
 *       401:
 *         description: Brak autoryzacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd podczas generowania sugestii
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// AI Suggestions endpoint (protected)
app.post('/api/ai/suggestions', authenticateToken, async (req, res) => {
  try {
    const { currentItems = [] } = req.body;
    const userId = req.user.id;
    
    // Pobierz historię zakupów (produkty oznaczone jako kupione)
    // Uwzględnij ostatnie 60 dni historii
    // Use database-agnostic date function
    const usePostgres = !!process.env.DATABASE_URL;
    const dateQuery = usePostgres 
      ? `bought_date >= NOW() - INTERVAL '60 days'`
      : `bought_date >= datetime('now', '-60 days')`;
    
    const history = await db.all(
      `SELECT * FROM items 
       WHERE user_id = ? AND bought = 1 AND bought_date IS NOT NULL 
       AND ${dateQuery}
       ORDER BY bought_date DESC`,
      [userId]
    );
    
    const suggestions = generateSuggestions(history, currentItems);
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to generate suggestions' });
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Sprawdzenie statusu serwera
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serwer działa poprawnie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  if (fs.existsSync(clientBuildPath)) {
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      // Don't serve React app for API routes
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.warn('Warning: Client build directory not found. Frontend will not be served.');
  }
}

// Export app for testing
module.exports = app;

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Serving React app from /client/build');
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await db.close();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });
}

