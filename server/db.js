const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Determine which database to use
const DATABASE_URL = process.env.DATABASE_URL;
const usePostgres = !!DATABASE_URL;

let db = null;
let pgPool = null;

// Database abstraction layer
class Database {
  constructor() {
    if (usePostgres) {
      // PostgreSQL connection
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      console.log('✅ Using PostgreSQL database');
    } else {
      // SQLite connection
      const dbPath = path.join(__dirname, 'shopping_list.db');
      db = new sqlite3.Database(dbPath);
      console.log('✅ Using SQLite database');
    }
  }

  // Initialize database tables
  async initialize() {
    if (usePostgres) {
      return this.initializePostgres();
    } else {
      return this.initializeSQLite();
    }
  }

  async initializePostgres() {
    const client = await pgPool.connect();
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(255),
          quantity INTEGER DEFAULT 1,
          price REAL,
          bought INTEGER DEFAULT 0,
          bought_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Try to add columns if they don't exist (migrations)
      try {
        await client.query('ALTER TABLE items ADD COLUMN user_id INTEGER');
      } catch (err) {
        // Column already exists, ignore
      }

      try {
        await client.query('ALTER TABLE items ADD COLUMN bought_date TIMESTAMP');
      } catch (err) {
        // Column already exists, ignore
      }

      console.log('✅ PostgreSQL tables initialized');
    } finally {
      client.release();
    }
  }

  initializeSQLite() {
    return new Promise((resolve, reject) => {
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

        console.log('✅ SQLite tables initialized');
        resolve();
      });
    });
  }

  // Execute a query and return a single row
  get(query, params = []) {
    if (usePostgres) {
      return this.getPostgres(query, params);
    } else {
      return this.getSQLite(query, params);
    }
  }

  async getPostgres(query, params) {
    const client = await pgPool.connect();
    try {
      // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, ...)
      const pgQuery = this.convertQuery(query, params);
      const result = await client.query(pgQuery.query, pgQuery.params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  getSQLite(query, params) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Execute a query and return all rows
  all(query, params = []) {
    if (usePostgres) {
      return this.allPostgres(query, params);
    } else {
      return this.allSQLite(query, params);
    }
  }

  async allPostgres(query, params) {
    const client = await pgPool.connect();
    try {
      const pgQuery = this.convertQuery(query, params);
      const result = await client.query(pgQuery.query, pgQuery.params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  allSQLite(query, params) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Execute a query (INSERT, UPDATE, DELETE) and return lastID and changes
  run(query, params = []) {
    if (usePostgres) {
      return this.runPostgres(query, params);
    } else {
      return this.runSQLite(query, params);
    }
  }

  async runPostgres(query, params) {
    const client = await pgPool.connect();
    try {
      // Check if query has RETURNING clause
      const hasReturning = query.toUpperCase().includes('RETURNING');
      let pgQuery = this.convertQuery(query, params);
      
      // If no RETURNING and it's an INSERT, add it for PostgreSQL
      if (!hasReturning && query.trim().toUpperCase().startsWith('INSERT')) {
        // Extract table name and add RETURNING id
        const insertMatch = query.match(/INSERT INTO\s+(\w+)/i);
        if (insertMatch) {
          pgQuery.query = pgQuery.query.replace(/;$/, '') + ' RETURNING id';
        }
      }
      
      const result = await client.query(pgQuery.query, pgQuery.params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0,
        rows: result.rows
      };
    } finally {
      client.release();
    }
  }

  runSQLite(query, params) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // Convert SQLite query with ? placeholders to PostgreSQL with $1, $2, etc.
  convertQuery(query, params) {
    if (!usePostgres) {
      return { query, params };
    }

    let paramIndex = 1;
    const pgParams = [];
    const pgQuery = query.replace(/\?/g, () => {
      pgParams.push(params[paramIndex - 1]);
      return `$${paramIndex++}`;
    });

    return { query: pgQuery, params: pgParams };
  }

  // Close database connection
  close() {
    if (usePostgres) {
      return pgPool.end();
    } else {
      return new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

// Create and export database instance
const database = new Database();

module.exports = database;

