import NextAuth from "next-auth";
import { getStoreAsync } from '@/lib/store';
import authConfig from '@/lib/auth.config';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  session: { strategy: 'jwt' },
  ...authConfig,
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
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Provision user in TinyBase on first OIDC login
      const store = await getStoreAsync();
      const existing = await store.users.findByEmail(user.email);
      if (!existing) {
        await store.users.create({
          name: user.name || null,
          email: user.email,
          image: user.image || undefined,
          role: 'CUSTOMER',
        });
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user?.email) {
        const store = await getStoreAsync();
        const dbUser = await store.users.findByEmail(user.email);
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name || `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() || dbUser.email;
          token.image = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.image = token.image || undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
});
