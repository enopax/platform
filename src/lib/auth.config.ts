import { NextAuthConfig } from "next-auth";

export default {
  providers: [
    // providers are in auth.ts
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.name = `${user.firstname} ${user.lastname}`;
        token.sub = user.id; // Ensure user ID is in token
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
