const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'shopping_list.db');
const db = new sqlite3.Database(dbPath);

// Test account credentials
const testUser = {
  username: 'test',
  email: 'test@example.com',
  password: 'test123'
};

async function createTestUser() {
  return new Promise((resolve, reject) => {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', 
      [testUser.username, testUser.email], 
      async (err, row) => {
        if (err) {
          console.error('Error checking for existing user:', err);
          return reject(err);
        }

        if (row) {
          console.log('✅ Konto testowe już istnieje!');
          console.log(`   Username: ${testUser.username}`);
          console.log(`   Email: ${testUser.email}`);
          console.log(`   Password: ${testUser.password}`);
          db.close();
          return resolve();
        }

        try {
          // Hash password
          const hashedPassword = await bcrypt.hash(testUser.password, 10);

          // Create user
          db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [testUser.username, testUser.email, hashedPassword],
            function(err) {
              if (err) {
                console.error('Error creating test user:', err);
                return reject(err);
              }

              console.log('✅ Konto testowe zostało utworzone!');
              console.log(`   Username: ${testUser.username}`);
              console.log(`   Email: ${testUser.email}`);
              console.log(`   Password: ${testUser.password}`);
              console.log(`   User ID: ${this.lastID}`);
              
              db.close();
              resolve();
            }
          );
        } catch (error) {
          console.error('Error hashing password:', error);
          reject(error);
        }
      }
    );
  });
}

// Initialize database tables first
db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
      db.close();
      process.exit(1);
    } else {
      createTestUser().catch((err) => {
        console.error('Error creating test user:', err);
        db.close();
        process.exit(1);
      });
    }
  });
});

