'use client'

import Link from 'next/link';
import { useState, useEffect, useActionState } from 'react';
import { Callout } from '@/components/common/Callout';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Divider } from '@/components/common/Divider';
import { Switch } from '@/components/common/Switch';
import { Badge } from '@/components/common/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectGroupLabel,
} from '@/components/common/Select';
import { settings } from '@/actions/user';
import StorageTierSelector, { StorageTier } from './StorageTierSelector';


export default function SettingsForm({
  user
}: {
  user: any,
}) {
  const [state, formAction, isPending] = useActionState(settings, null);
  const [selectedTier, setSelectedTier] = useState<StorageTier>(user.storageTier || 'FREE_500MB');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.payload?.status == 'rejected' && (
        <Callout variant="error" title="Error">
          {state?.payload?.reason}
        </Callout>
      )}
      {state?.payload?.status == 'accepted' && (
        <Callout variant="success" title="Success">
          Your account has been updated successfully!
        </Callout>
      )}

      <div className="space-y-2">
        <Label htmlFor="firstname">First Name</Label>
        <Input
          placeholder="Enter your first name"
          id="firstname"
          name="firstname"
          type="text"
          defaultValue={user.firstname}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastname">Last Name</Label>
        <Input
          placeholder="Enter your last name"
          id="lastname"
          name="lastname"
          type="text"
          defaultValue={user.lastname}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          placeholder="Enter email"
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
        />
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
        Submit
      </Button>
    </form>
  );
}
