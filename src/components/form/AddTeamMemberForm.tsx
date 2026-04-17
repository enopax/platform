'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addTeamMember, type AddTeamMemberState } from '@/actions/team';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';

const initialState: AddTeamMemberState = {};

interface AvailableMember {
  id: string;
  name: string | null;
  email: string;
}

interface AddTeamMemberFormProps {
  teamId: string;
  organisationName: string;
  teamName: string;
  availableMembers: AvailableMember[];
}

export default function AddTeamMemberForm({
  teamId,
  organisationName,
  teamName,
  availableMembers,
}: AddTeamMemberFormProps) {
  const boundAction = addTeamMember.bind(null, teamId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push(`/orga/${organisationName}/teams/${teamName}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state?.success, organisationName, teamName, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Add a member to {teamName}
      </h2>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Member added" icon={RiCheckboxCircleFill} className="mb-4">
          Redirecting back to the team page…
        </Callout>
      )}

      {availableMembers.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All organisation members are already in this team.
        </p>
      ) : (
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="userId">Member</Label>
            <Select name="userId" disabled={pending || !!state?.success}>
              <SelectTrigger id="userId" className={state?.fieldErrors?.userId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name ? `${m.name} (${m.email})` : m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.userId && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.userId}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="light"
              onClick={() => router.push(`/orga/${organisationName}/teams/${teamName}`)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !!state?.success}>
              {pending ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
