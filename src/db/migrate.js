/**
 * Run this script once to create the tables in your Neon database.
 * Usage: node src/db/migrate.js
 *
 * Requires DATABASE_URL in .env.local or as an environment variable.
 */

const { neon } = require('@neondatabase/serverless');

// Load .env.local manually since dotenv may not be installed
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Create a .env.local file or set it as an env variable.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      score INTEGER NOT NULL CHECK (score >= 0),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
  `;

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
