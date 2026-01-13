const { Pool } = require('pg');

// Railway provides DATABASE_URL, local dev uses individual vars
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  : new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'recycleshare',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// Initialize database with schema
const initializeDatabase = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      profile_picture VARCHAR(500),
      phone VARCHAR(20) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      is_verified BOOLEAN DEFAULT FALSE,
      verification_code VARCHAR(6),
      verification_code_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );
  `;

  try {
    await pool.query(createUsersTable);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase
};
