import type { Metadata } from "next";
//import { GeistSans } from "geist/font/sans";
import Image from "next/image";
import { Geist } from 'next/font/google';
import "./globals.css";

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import UserBar from '@/components/layout/UserBar';
import Footer from '@/components/layout/Footer';
import CommandPaletteProvider from '@/components/navigation/CommandPaletteProvider';

const geist = Geist({
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: 'Enopax File System',
  description: process.env.NEXT_PUBLIC_META_DESC,
  openGraph: {
    images: [process.env.NEXT_PUBLIC_OG_IMAGE || ''],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${geist.className} antialiased bg-gray-50 dark:bg-gray-950`}>
        <div className="text-neutral-800 dark:text-neutral-200">
          <UserBar user={session?.user} />
          {children}
          <Footer />
          <CommandPaletteProvider />
        </div>
      </body>
    </html>
  );
}