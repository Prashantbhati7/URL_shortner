import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Simple in-memory fallback database for local development without Postgres
class MemoryDb {
  constructor() {
    this.urls = [];
    this.clicks = [];
    console.warn('⚠️ Using In-Memory Database (Postgres is offline).');
  }

  async query(sql, params = []) {
    const q = sql.toLowerCase();
    
    if (q.includes('insert into urls')) {
      const row = {
        id: params[0],
        original_url: params[1],
        short_code: params[2],
        user_id: params[3] || null,
        expires_at: params[4] || null,
        click_count: 0,
        created_at: new Date()
      };
      this.urls.push(row);
      return { rows: [row], rowCount: 1 };
    }
    
    if (q.includes('select') && q.includes('from urls')) {
      const code = params[0];
      const match = this.urls.find(u => u.short_code === code);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }
    
    if (q.includes('update urls')) {
      const id = params[1] || params[0];
      const match = this.urls.find(u => u.id == id);
      if (match) match.click_count += 1;
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }
    
    if (q.includes('insert into user_clicks')) {
      const row = {
        url_id: params[0],
        ip_address: params[1],
        user_agent: params[2],
        clicked_at: new Date()
      };
      this.clicks.push(row);
      return { rows: [row], rowCount: 1 };
    }
    
    if (q.includes('select') && q.includes('from user_clicks')) {
      const urlId = params[0];
      const matches = this.clicks.filter(c => c.url_id == urlId);
      return { rows: matches, rowCount: matches.length };
    }
    
    return { rows: [], rowCount: 0 };
  }
}

// Check if we should use SSL (standard for cloud databases like Neon)
const dbUrl = process.env.DATABASE_URL;
const useSsl = dbUrl && (
  dbUrl.includes('sslmode=') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('ssl=') ||
  process.env.DB_SSL === 'true' ||
  (!dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('db:'))
);

const pool = new Pool({
  connectionString: dbUrl || 'postgresql://postgres:postgres@localhost:5432/tinyurl',
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

let activePool = pool;
let isFallback = false;

// Run schema migrations on startup
const initDb = async () => {
  if (global.dbInitialized || isFallback) return;

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS urls (
        id BIGINT PRIMARY KEY,
        original_url TEXT NOT NULL,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        click_count INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_clicks (
        id BIGSERIAL PRIMARY KEY,
        url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
        ip_address VARCHAR(255),
        user_agent TEXT,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(schema);
    global.dbInitialized = true;
    console.log('✅ Database schema verified/initialized successfully.');
  } catch (err) {
    console.error('⚠️ Database schema verification failed:', err.message);
  }
};

// Connect checks
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Connected to PostgreSQL database.');
    initDb();
  })
  .catch((err) => {
    console.warn('⚠️ Database connection warning. Falling back to In-Memory.');
    activePool = new MemoryDb();
    isFallback = true;
  });

const dbInstance = {
  query: async (text, params) => {
    try {
      if (!isFallback && !global.dbInitialized) {
        await initDb();
      }
      return await activePool.query(text, params);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Database connection lost. Switching to In-Memory:', err.message);
        activePool = new MemoryDb();
        isFallback = true;
      }
      return activePool.query(text, params);
    }
  },
  get pool() {
    return isFallback ? null : pool;
  },
  get isActiveFallback() {
    return isFallback;
  }
};

export default dbInstance;
