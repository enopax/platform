import type { NextAuthConfig } from "next-auth";

/**
 * Auth config shared between middleware (Edge runtime) and the full
 * auth.ts (Node runtime). Must not contain OIDC providers or adapters
 * that require Node APIs or network calls — Edge can't handle those.
 *
 * Middleware uses this to check JWT session existence and redirect
 * unauthenticated users. The full provider config lives in auth.ts.
 */
export default {
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const publicPaths = ['/', '/signin', '/register', '/accept-invite', '/api/auth', '/api/email'];
      const isPublic = publicPaths.some(p =>
        nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/')
      );

      if (isPublic) return true;

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
