'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam, type CreateTeamState } from '@/actions/team';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';

const initialState: CreateTeamState = {};

const PROJECT_ROLES = [
  { value: 'VIEWER', label: 'Viewer — read-only access' },
  { value: 'DEVELOPER', label: 'Developer — develop and deploy' },
  { value: 'DEPLOYER', label: 'Deployer — deploy only' },
  { value: 'ADMIN', label: 'Admin — full project control' },
];

interface CreateTeamFormProps {
  organisationId: string;
  organisationName: string;
}

export default function CreateTeamForm({ organisationId, organisationName }: CreateTeamFormProps) {
  const boundAction = createTeam.bind(null, organisationId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state?.teamName) {
      const timer = setTimeout(() => {
        router.push(`/orga/${organisationName}/teams/${state.teamName}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state?.success, state?.teamName, organisationName, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Create a new team
      </h2>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Team created" icon={RiCheckboxCircleFill} className="mb-4">
          Redirecting to team page…
        </Callout>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. frontend-engineers"
            hasError={!!state?.fieldErrors?.name}
            disabled={pending || !!state?.success}
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            type="text"
            placeholder="Optional description"
            disabled={pending || !!state?.success}
          />
        </div>

        <div>
          <Label htmlFor="defaultProjectRole">Default project role</Label>
          <Select name="defaultProjectRole" defaultValue="DEVELOPER" disabled={pending || !!state?.success}>
            <SelectTrigger id="defaultProjectRole" className={state?.fieldErrors?.defaultProjectRole ? 'border-red-500' : ''}>
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.defaultProjectRole && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.defaultProjectRole}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="light"
            onClick={() => router.push(`/orga/${organisationName}/teams`)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !!state?.success}>
            {pending ? 'Creating…' : 'Create team'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
