'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inviteMember, type InviteMemberState } from '@/actions/invitation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';

const initialState: InviteMemberState = {};

const ROLES = [
  { value: 'OWNER', label: 'Owner — full control' },
  { value: 'ADMIN', label: 'Admin — manage settings and members' },
  { value: 'MANAGER', label: 'Manager — manage projects and members' },
  { value: 'MEMBER', label: 'Member — collaborate on projects' },
];

interface InviteMemberFormProps {
  organisationId: string;
  organisationName: string;
}

export default function InviteMemberForm({ organisationId, organisationName }: InviteMemberFormProps) {
  const inviteAction = inviteMember.bind(null, organisationId);
  const [state, formAction, pending] = useActionState(inviteAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push(`/${organisationName}/members`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state?.success, organisationName, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Invite a member to {organisationName}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        They&apos;ll receive an email with a link to join. If they don&apos;t have an Enopax account yet, they can register directly from the invite link.
      </p>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Invitation sent" icon={RiCheckboxCircleFill} className="mb-4">
          Redirecting back to the members list…
        </Callout>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="person@example.com"
            hasError={!!state?.fieldErrors?.email}
            disabled={pending || state?.success}
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select name="role" defaultValue="MEMBER" disabled={pending || state?.success}>
            <SelectTrigger id="role" className={state?.fieldErrors?.role ? 'border-red-500' : ''}>
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.role && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.role}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="light"
            onClick={() => router.push(`/${organisationName}/members`)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending || state?.success}>
            {pending ? 'Sending…' : 'Send invitation'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
