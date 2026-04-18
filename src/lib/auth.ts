import NextAuth from "next-auth";
import { getStoreAsync } from '@/lib/store';
import authConfig from '@/lib/auth.config';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  debug: process.env.NODE_ENV === 'development',
  session: { strategy: 'jwt' },
  providers: [
    {
      id: 'dex',
      name: 'Enopax',
      type: 'oidc',
      issuer: process.env.DEX_ISSUER,
      clientId: process.env.DEX_CLIENT_ID,
      clientSecret: process.env.DEX_CLIENT_SECRET,
      authorization: { params: { scope: 'openid profile email' } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username || profile.email,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;

      const store = await getStoreAsync();
      const existing = await store.users.findByEmail(user.email);
      if (!existing) {
        await store.users.create({
          name: user.name || null,
          email: user.email,
          image: user.image || undefined,
          role: 'GUEST',
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const store = await getStoreAsync();
        const dbUser = await store.users.findByEmail(user.email);
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name || `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() || dbUser.email;
          token.slug = dbUser.slug || '';
          token.image = dbUser.image;
          token.emailVerified = dbUser.emailVerified ? true : false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.slug = token.slug as string;
        session.user.image = token.image || undefined;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
});
