'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  useEffect(() => {
    signIn('dex', { callbackUrl: '/' });
  }, []);

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <p className="text-gray-500">Redirecting to login...</p>
    </main>
  );
}
