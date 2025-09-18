'use client'

import Link from 'next/link';
import { useSearchParams } from 'next/navigation'
import { useState, useDeferredValue, useActionState } from 'react';
import { Callout } from '@/components/common/Callout';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { sendEmail } from '@/actions/user';

export default function MagicLinkForm() {
  const [state, formAction, isPending] = useActionState(sendEmail, null);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const deferredEmail = useDeferredValue(email);

  return (
    <form action={formAction} className="space-y-4">
      {state?.payload?.status == 'accepted' && (
        <Callout variant="success" title="Email">
          Email sent! Check your inbox.
        </Callout>
      )}
      {state?.payload?.status == 'rejected' && (
        <Callout variant="error" title="Error">
          Email could not be sent :(
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

      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-2">
          <Checkbox id="r1" checked />
          <Label htmlFor="r1">Stay signed in.</Label>
        </div>

        <div className="flex flex-col text-sm font-medium ">
          <Link href={`/signin/credentials?email=${email}`} className="hover:text-brand-500">
            Sign in with password
          </Link>
          <Link href="/signup" className="hover:text-brand-500">
            Create an account
          </Link>
        </div>
      </div>

      <div>
        <Button className="w-full" isLoading={isPending}>
          Send email
        </Button>
      </div>
    </form>
  );
}
