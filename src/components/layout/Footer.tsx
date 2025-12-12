import Link from 'next/link';
import { RiGithubFill, RiDiscordFill, RiTwitterXFill } from '@remixicon/react';

export default function Footer() {
  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">

          <div className="mb-16 pt-16 flex flex-wrap justify-center gap-12 lg:gap-16">
            <div className="w-full max-w-xs text-left">
              <span className="font-bold uppercase tracking-widest">
                Socials
              </span>

              <div className="flex gap-4 justify-start">
                {/*Socials*/}
              </div>
            </div>

            <div className="w-40 text-left">
              <span className="font-bold uppercase tracking-widest">
                Platform
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="/signin"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Login
                </Link>

                <Link
                  href="/signup"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Register
                </Link>
              </nav>
            </div>

            <div className="w-40 text-left">
              <span className="font-bold uppercase tracking-widest">
                Resources
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="/docs/api"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > API Documentation
                </Link>
              </nav>
            </div>

            <div className="w-40 text-left">
              <span className="font-bold uppercase tracking-widest">
                Legal
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="/docs/tos"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Terms of Service
                </Link>

                <Link
                  href="/docs/privacy"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Privacy Policy
                </Link>
              </nav>
            </div>
          </div>

          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Enopax
          </div>
        
      </div>
    </footer>
  );
}
