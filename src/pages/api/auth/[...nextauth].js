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
        await db.insert(users).values({
          id: user.id,
          name: user.name ?? 'Unknown',
          image: user.image ?? null,
        }).onConflictDoUpdate({
          target: users.id,
          set: {
            name: user.name ?? 'Unknown',
            image: user.image ?? null,
          },
        });
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
