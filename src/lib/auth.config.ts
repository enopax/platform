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
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { image: true, role: true },
        });

        session.user.id = token.sub;
        session.user.role = user?.role as string;
        session.user.name = token.name as string;
        session.user.image = user?.image || undefined;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
