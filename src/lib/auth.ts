import NextAuth from "next-auth";
import Nodemailer from 'next-auth/providers/nodemailer';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcrypt-ts';
import { prisma } from '@/lib/prisma';
import authConfig from '@/lib/auth.config';

// Build providers array conditionally
const providers = [];

// Only add Nodemailer if EMAIL_SERVER is configured
if (process.env.EMAIL_SERVER) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

// Always include Credentials provider
providers.push(
  Credentials({
    authorize: async (credentials: Partial<Record<string, unknown>>) => {
      const { email, password } = credentials as { email: string; password: string };
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) return null;

      const passwordsMatch = await compare(password, user.password);
      return passwordsMatch ? user : null;
    },
  })
);

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  debug: false,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  providers,
});
