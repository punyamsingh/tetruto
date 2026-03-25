import { db } from '@/db';
import { scores, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const topScores = await db
        .select({
          id: scores.id,
          score: scores.score,
          createdAt: scores.createdAt,
          userName: users.name,
          userImage: users.image,
        })
        .from(scores)
        .innerJoin(users, eq(scores.userId, users.id))
        .orderBy(desc(scores.score))
        .limit(10);

      return res.status(200).json(topScores);
    } catch (err) {
      console.error('Leaderboard GET error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const rawScore = req.body && req.body.score;
      const score = Number(rawScore);
      if (!Number.isInteger(score) || score < 1) {
        return res.status(400).json({ error: 'Invalid score' });
      }

      await db.insert(scores).values({
        userId: session.user.id,
        score,
      });

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('Leaderboard POST error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
