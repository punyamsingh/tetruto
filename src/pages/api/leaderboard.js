import { db } from '@/db';
import { scores, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get top 10 scores with user info
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
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { score } = req.body;
    if (typeof score !== 'number' || score < 1) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    await db.insert(scores).values({
      userId: session.user.id,
      score,
    });

    return res.status(201).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
