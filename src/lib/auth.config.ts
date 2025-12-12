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
        token.image = user.image;
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

      // Fetch latest user data from database to ensure image is up-to-date
      try {
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { image: true },
        });
        if (user?.image) {
          session.user.image = user.image;
        }
      } catch (error) {
        console.error('Failed to fetch user image in session callback:', error);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
