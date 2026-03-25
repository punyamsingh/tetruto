import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === 'google') {
        const existing = await db.select().from(users).where(eq(users.id, user.id));
        if (existing.length === 0) {
          await db.insert(users).values({
            id: user.id,
            name: user.name,
            image: user.image,
          });
        } else {
          await db.update(users).set({
            name: user.name,
            image: user.image,
          }).where(eq(users.id, user.id));
        }
      }
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
