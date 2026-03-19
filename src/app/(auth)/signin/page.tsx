import { signIn } from '@/lib/auth';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiShieldKeyholeLine } from '@remixicon/react';
import Link from 'next/link';

export default async function SignInPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Card className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-300">
            Sign In
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in with your Enopax account
          </p>
          <form
            action={async () => {
              'use server';
              await signIn('dex', { redirectTo: '/' });
            }}
          >
            <Button type="submit" className="w-full">
              <RiShieldKeyholeLine className="mr-2 size-5" />
              Sign in with Enopax
            </Button>
          </form>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Create one
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
