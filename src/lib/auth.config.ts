import { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";

export default {
  providers: [
    // providers are in auth.ts
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.name = `${user.firstname} ${user.lastname}`;
        token.sub = user.id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role =token.role as string;
        session.user.name = token.name as string;
        session.user.image = token.image || undefined;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
