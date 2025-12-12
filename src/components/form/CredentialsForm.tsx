'use client'

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useDeferredValue, useActionState } from 'react';
import { sendCredentials } from '@/actions/user';
import { Callout } from '@/components/common/Callout';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';

export default function CredentialsForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(sendCredentials, null);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const deferredEmail = useDeferredValue(email);

  useEffect(() => {
    if (state?.payload?.status == 'accepted') {
      router.replace('/orga');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.payload?.status == 'rejected' && (
        <Callout variant="error" title="Error">
          {state.payload?.reason}
        </Callout>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          placeholder="Enter email"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={({target}) => setEmail(target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          placeholder="Enter password"
          id="password"
          name="password"
          type="password"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-2">
          <Checkbox id="r1" checked />
          <Label htmlFor="r1">Stay signed in.</Label>
        </div>

        <div className="flex flex-col text-sm font-medium text-brand-">
          <Link href={`/signin?email=${email}`} className="hover:text-brand-500">
            Sign in with email
          </Link>
          <Link href="/signup" className="hover:text-brand-500">
            Create an account
          </Link>
        </div>
      </div>

      <div>
        <Button className="w-full" isLoading={isPending}>
          Sign In
        </Button>
      </div>
    </form>
  );
}
