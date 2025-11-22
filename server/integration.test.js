const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import app setup
// Set NODE_ENV to test to prevent server from starting
process.env.NODE_ENV = 'test';
const app = require('./index');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to get auth token
async function getAuthToken(username = null, email = null, password = 'testpass123') {
  // Generate unique username/email if not provided
  const timestamp = Date.now();
  const finalUsername = username || `testuser_${timestamp}`;
  const finalEmail = email || `test_${timestamp}@example.com`;
  
  // Try to register user first
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ username: finalUsername, email: finalEmail, password });
  
  if (registerRes.status === 201 && registerRes.body.token) {
    return registerRes.body.token;
  }
  
  // If user exists, try login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: finalUsername, password });
  
  if (loginRes.status === 200 && loginRes.body.token) {
    return loginRes.body.token;
  }
  
  throw new Error(`Failed to get auth token. Register: ${registerRes.status}, Login: ${loginRes.status}`);
}

describe('API Integration Tests', () => {
  // Note: These tests use the actual database
  // In production, consider using a separate test database

  describe('Health Check', () => {
    test('GET /api/health powinien zwrócić status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      test('powinien zarejestrować nowego użytkownika', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password: 'testpass123'
          })
          .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('username', uniqueUsername);
        expect(response.body.user).toHaveProperty('email', uniqueEmail);
      });

      test('powinien zwrócić błąd gdy brakuje wymaganych pól', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser'
            // brakuje email i password
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      test('powinien zwrócić błąd gdy hasło jest za krótkie', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password: '12345' // za krótkie
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('6 characters');
      });

      test('powinien zwrócić błąd gdy użytkownik już istnieje', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        
        // Pierwsza rejestracja
        await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password: 'testpass123'
          })
          .expect(201);

        // Druga rejestracja z tym samym username
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: `different_${Date.now()}@example.com`,
            password: 'testpass123'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('already exists');
      });
    });

    describe('POST /api/auth/login', () => {
      test('powinien zalogować użytkownika z poprawnymi danymi', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const password = 'testpass123';

        // Najpierw zarejestruj użytkownika
        await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password
          });

        // Teraz zaloguj
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: uniqueUsername,
            password
          })
          .expect(200);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('username', uniqueUsername);
      });

      test('powinien zalogować użytkownika używając email', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const password = 'testpass123';

        // Najpierw zarejestruj użytkownika
        await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password
          });

        // Zaloguj używając email
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: uniqueEmail,
            password
          })
          .expect(200);

        expect(response.body).toHaveProperty('token');
      });

      test('powinien zwrócić błąd przy niepoprawnym haśle', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;

        // Zarejestruj użytkownika
        await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password: 'testpass123'
          });

        // Spróbuj zalogować z niepoprawnym hasłem
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: uniqueUsername,
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });

      test('powinien zwrócić błąd gdy brakuje danych', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser'
            // brakuje password
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/auth/verify', () => {
      test('powinien zweryfikować poprawny token', async () => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const password = 'testpass123';

        // Register user first
        const registerRes = await request(app)
          .post('/api/auth/register')
          .send({
            username: uniqueUsername,
            email: uniqueEmail,
            password
          })
          .expect(201);

        const token = registerRes.body.token;
        expect(token).toBeDefined();

        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty('valid', true);
        expect(response.body).toHaveProperty('user');
      });

      test('powinien zwrócić błąd bez tokena', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });

      test('powinien zwrócić błąd z niepoprawnym tokenem', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', 'Bearer invalid_token')
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Items Endpoints', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      authToken = await getAuthToken();
      expect(authToken).toBeDefined();
      const decoded = jwt.verify(authToken, JWT_SECRET);
      userId = decoded.id;
      expect(userId).toBeDefined();
    });

    describe('GET /api/items', () => {
      test('powinien zwrócić pustą listę dla nowego użytkownika', async () => {
        const response = await request(app)
          .get('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      test('powinien zwrócić tylko produkty użytkownika', async () => {
        // Dodaj produkt
        await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Product',
            category: 'Test',
            quantity: 1
          });

        const response = await request(app)
          .get('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('name', 'Test Product');
      });
    });

    describe('POST /api/items', () => {
      test('powinien dodać nowy produkt', async () => {
        const response = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Mleko',
            category: 'Nabiał',
            quantity: 2,
            price: 4.99
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Mleko');
        expect(response.body).toHaveProperty('category', 'Nabiał');
        expect(response.body).toHaveProperty('quantity', 2);
        expect(response.body).toHaveProperty('price', 4.99);
        expect(response.body).toHaveProperty('bought', 0);
      });

      test('powinien ustawić domyślną kategorię "Inne" gdy nie podano', async () => {
        const response = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Produkt bez kategorii'
          })
          .expect(201);

        expect(response.body).toHaveProperty('category', 'Inne');
      });

      test('powinien zwrócić błąd gdy brakuje nazwy', async () => {
        const response = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            category: 'Test'
            // brakuje name
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      test('powinien zwrócić błąd bez autoryzacji', async () => {
        const response = await request(app)
          .post('/api/items')
          .send({
            name: 'Test Product'
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/items/:id', () => {
      test('powinien zwrócić pojedynczy produkt', async () => {
        // Najpierw dodaj produkt
        const createResponse = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Product',
            category: 'Test'
          });

        const itemId = createResponse.body.id;

        // Teraz pobierz produkt
        const response = await request(app)
          .get(`/api/items/${itemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', itemId);
        expect(response.body).toHaveProperty('name', 'Test Product');
      });

      test('powinien zwrócić 404 dla nieistniejącego produktu', async () => {
        const response = await request(app)
          .get('/api/items/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/items/:id', () => {
      test('powinien zaktualizować produkt', async () => {
        // Najpierw dodaj produkt
        const createResponse = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Original Name',
            category: 'Original',
            quantity: 1
          });

        const itemId = createResponse.body.id;

        // Zaktualizuj produkt
        const response = await request(app)
          .put(`/api/items/${itemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Name',
            category: 'Updated',
            quantity: 2,
            price: 10.99,
            bought: 0
          })
          .expect(200);

        expect(response.body).toHaveProperty('name', 'Updated Name');
        expect(response.body).toHaveProperty('category', 'Updated');
        expect(response.body).toHaveProperty('quantity', 2);
        expect(response.body).toHaveProperty('price', 10.99);
      });

      test('powinien oznaczyć produkt jako kupiony', async () => {
        // Dodaj produkt
        const createResponse = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Product to Buy',
            category: 'Test'
          });

        const itemId = createResponse.body.id;

        // Oznacz jako kupiony
        const response = await request(app)
          .put(`/api/items/${itemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Product to Buy',
            category: 'Test',
            quantity: 1,
            bought: 1
          })
          .expect(200);

        expect(response.body).toHaveProperty('bought', 1);
        expect(response.body).toHaveProperty('bought_date');
        expect(response.body.bought_date).not.toBeNull();
      });

      test('powinien zwrócić 404 dla nieistniejącego produktu', async () => {
        const response = await request(app)
          .put('/api/items/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Name',
            category: 'Test',
            quantity: 1,
            bought: 0
          })
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/items/:id', () => {
      test('powinien usunąć produkt', async () => {
        // Najpierw dodaj produkt
        const createResponse = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Product to Delete',
            category: 'Test'
          });

        const itemId = createResponse.body.id;

        // Usuń produkt
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');

        // Sprawdź że produkt nie istnieje
        await request(app)
          .get(`/api/items/${itemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      test('powinien zwrócić 404 dla nieistniejącego produktu', async () => {
        const response = await request(app)
          .delete('/api/items/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/items', () => {
      test('powinien usunąć wszystkie produkty użytkownika', async () => {
        // Dodaj kilka produktów
        await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Product 1' });

        await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Product 2' });

        // Usuń wszystkie
        const response = await request(app)
          .delete('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBeGreaterThanOrEqual(2);

        // Sprawdź że lista jest pusta
        const getResponse = await request(app)
          .get('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(getResponse.body.length).toBe(0);
      });
    });
  });

  describe('AI Suggestions Endpoint', () => {
    let authToken;

    beforeEach(async () => {
      authToken = await getAuthToken();
      expect(authToken).toBeDefined();
    });

    describe('POST /api/ai/suggestions', () => {
      test('powinien zwrócić sugestie dla użytkownika z historią', async () => {
        // Najpierw dodaj kilka produktów i oznacz je jako kupione
        const item1 = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Mleko', category: 'Nabiał' });

        await request(app)
          .put(`/api/items/${item1.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Mleko',
            category: 'Nabiał',
            quantity: 1,
            bought: 1
          });

        // Teraz pobierz sugestie
        const response = await request(app)
          .post('/api/ai/suggestions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentItems: []
          })
          .expect(200);

        expect(response.body).toHaveProperty('suggestions');
        expect(response.body).toHaveProperty('regular');
        expect(response.body).toHaveProperty('overdue');
        expect(response.body).toHaveProperty('category');
        expect(response.body).toHaveProperty('complementary');
        expect(Array.isArray(response.body.suggestions)).toBe(true);
      });

      test('powinien zwrócić puste sugestie dla nowego użytkownika', async () => {
        const response = await request(app)
          .post('/api/ai/suggestions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentItems: []
          })
          .expect(200);

        expect(response.body).toHaveProperty('suggestions');
        expect(Array.isArray(response.body.suggestions)).toBe(true);
      });

      test('powinien zwrócić błąd bez autoryzacji', async () => {
        const response = await request(app)
          .post('/api/ai/suggestions')
          .send({
            currentItems: []
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });
  });
});

