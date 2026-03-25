import { pgTable, text, integer, timestamp, serial, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Google OAuth sub
  name: text('name').notNull(),
  image: text('image'),
});

export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  check('scores_score_non_negative', sql`${table.score} >= 0`),
]);
