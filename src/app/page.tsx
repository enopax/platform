import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Container from '@/components/common/Container';
import { Button } from '@/components/common/Button';

export default async function Page() {
  const session = await auth();
  if (session) {
    redirect('/orga');
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl">
        <Container>
          <div className="relative w-full h-[600px] overflow-hidden">
            <Image
              src="/assets/bg.png"
              alt="Background"
              className="object-cover object-top opacity-10 dark:invert"
              fill
              priority
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
              <div className="relative z-10 max-w-2xl px-4">
                <h1 className="text-5xl md:text-7xl font-bold text-brand-500 mb-6">
                  Resource Provisioning
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Deploy and manage infrastructure resources with one click.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/orga/organisations">
                    <Button className="px-8 py-3 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white">
                      Start Now
                    </Button>
                  </Link>
                  <Link href="/docs/api">
                    <Button variant="outline" className="px-8 py-3 text-lg font-semibold">
                      View API Docs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
