/**
 * Run this script once to create the tables in your Neon database.
 * Usage: node src/db/migrate.js
 *
 * Requires DATABASE_URL in .env or as an environment variable.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

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
      score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
  `;

  console.log('Migration complete.');
}

migrate().catch(console.error);
