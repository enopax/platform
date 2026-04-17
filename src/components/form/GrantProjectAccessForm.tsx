'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { grantProjectAccess, type GrantAccessState } from '@/actions/team';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';

const initialState: GrantAccessState = {};

interface AvailableTeam {
  id: string;
  name: string;
  defaultProjectRole: string;
}

interface GrantProjectAccessFormProps {
  projectId: string;
  availableTeams: AvailableTeam[];
  organisationName: string;
  projectName: string;
}

export default function GrantProjectAccessForm({
  projectId,
  availableTeams,
  organisationName,
  projectName,
}: GrantProjectAccessFormProps) {
  const boundAction = grantProjectAccess.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push(`/${organisationName}/${projectName}/access`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state?.success, organisationName, projectName, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Grant team access to {projectName}
      </h2>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Access granted" icon={RiCheckboxCircleFill} className="mb-4">
          Redirecting back to the access page…
        </Callout>
      )}

      {availableTeams.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All organisation teams already have access to this project.
        </p>
      ) : (
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="teamId">Team</Label>
            <Select name="teamId" disabled={pending || !!state?.success}>
              <SelectTrigger id="teamId" className={state?.fieldErrors?.teamId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (default: {t.defaultProjectRole})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.teamId && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.teamId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="DEVELOPER" disabled={pending || !!state?.success}>
              <SelectTrigger id="role" className={state?.fieldErrors?.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">VIEWER</SelectItem>
                <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
                <SelectItem value="DEPLOYER">DEPLOYER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
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
              onClick={() => router.push(`/${organisationName}/${projectName}/access`)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !!state?.success}>
              {pending ? 'Granting…' : 'Grant access'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
