import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">

          <div className="mb-16 pt-16 flex flex-wrap justify-center gap-12 lg:gap-16">
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
                  href="/register"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Register
                </Link>
              </nav>
            </div>

            <div className="w-40 text-left">
              <span className="font-bold uppercase tracking-widest">
                Legal
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="/docs/imprint"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Imprint
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
