import type { Metadata } from "next";
import { Geist } from 'next/font/google';
import "./globals.css";

import { auth } from '@/lib/auth';

import UserBar from '@/components/layout/UserBar';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import CommandPaletteProviderWrapper from '@/components/navigation/CommandPaletteProvider';
import { CommandPaletteProvider } from '@/hooks/useCommandPalette';
import { MobileMenuProvider } from '@/hooks/useMobileMenu';

const geist = Geist({
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: 'Enopax — European Infrastructure',
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
        <CommandPaletteProvider>
          <MobileMenuProvider>
            <div className="text-neutral-800 dark:text-neutral-200">
              <UserBar user={session?.user} />
              <MobileNavigation user={session?.user} />
              {children}
              <CommandPaletteProviderWrapper />
            </div>
          </MobileMenuProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
