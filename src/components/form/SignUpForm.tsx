'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useActionState } from 'react';
import { Callout } from '@/components/common/Callout';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Divider } from '@/components/common/Divider';
import { register } from '@/actions/user';

export default function SignUpForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(register, null);

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
          {state?.payload?.reason}
        </Callout>
      )}

      <div className="space-y-2">
        <Label htmlFor="firstname">First Name</Label>
        <Input placeholder="Enter your first name" id="firstname" name="firstname" type="text" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastname">Last Name</Label>
        <Input placeholder="Enter your last name" id="lastname" name="lastname" type="text" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input placeholder="Enter username" id="username" name="username" type="text" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input placeholder="Enter email" id="email" name="email" type="email" />
      </div>

      <Divider>Password</Divider>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input placeholder="Enter password" id="password" name="password" type="password" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password2">Repeat the password</Label>
        <Input placeholder="Repeat password" id="password2" name="password2" type="password" />
      </div>

      <Button className="w-full" isLoading={isPending}>
        Sign Up
      </Button>

      <div className="text-sm">
        <Link href="/signin" className="font-medium hover:text-brand-500">
          You already have an account? Click here.
        </Link>
      </div>
    </form>
  );
}
