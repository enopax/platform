import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/common/Container';
import Logo from '@/components/Logo';
import DiscordSection from '@/components/DiscordSection';

const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL as string;

export default function Footer() {
  return (
    <footer>
      <Container>
      <div className="max-w-4xl m-auto overflow-x-hidden">
        
          <div className="mb-16 pt-16 grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-6 lg:gap-8">
            <div className="col-span-full lg:col-span-2">
              <p className="mb-6 italic sm:pr-8">
                "Decentralized storage for the distributed web"
              </p>

              <div className="flex gap-4">
                <Link href="https://github.com/ipfs/ipfs" target="_blank" className="group">
                  <Image
                    src="/icons/github.svg"
                    alt="Github"
                    width={32}
                    height={32}
                    className="h-6 w-6 object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </Link>

                <Link href="https://x.com/ipfs" target="_blank" className="group">
                  <Image
                    src="/icons/x.svg"
                    alt="X (Twitter)"
                    width={32}
                    height={32}
                    className="h-6 w-6 object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </Link>

                <Link href="https://discord.gg/ipfs" target="_blank" className="group">
                  <Image
                    src="/icons/discord.svg"
                    alt="Discord"
                    width={32}
                    height={32}
                    className="h-6 w-6 object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </Link>
              </div>
            </div>

            <div>
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

                <Link
                  href="/nodes"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Node Status
                </Link>

              </nav>
            </div>

            <div>
              <span className="font-bold uppercase tracking-widest">
                Resources
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="https://docs.ipfs.tech"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Documentation
                </Link>

                <Link
                  href="https://ipfs.tech"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > IPFS.tech
                </Link>

                <Link
                  href="https://discuss.ipfs.tech"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Community
                </Link>
              </nav>
            </div>

            <div>
              <span className="font-bold uppercase tracking-widest">
                Legal
              </span>

              <nav className="mt-4 flex flex-col gap-4">
                <Link
                  href="/tos"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Terms of Service
                </Link>

                <Link
                  href="/privacy"
                  className="transition duration-100 hover:text-brand-500 active:text-brand-600"
                > Privacy Policy
                </Link>
              </nav>
            </div>
          </div>

          <div className="py-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} IPFS Storage • Powered by the InterPlanetary File System
          </div>
        
      </div>
      </Container>
    </footer>
  );
}
