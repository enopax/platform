'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { PermissionGrid } from './PermissionGrid';
import type { RoleState } from '@/actions/project-role';
import type { ProjectPermission, ProjectRoleDefinition } from '@/lib/store';

interface RoleFormProps {
  organisationName: string;
  organisationId: string;
  role?: ProjectRoleDefinition;
  action: (prevState: RoleState, formData: FormData) => Promise<RoleState>;
}

const initialState: RoleState = {};

export function RoleForm({ organisationName, role, action }: RoleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  const defaultPerms: ProjectPermission[] = role?.permissions ?? ['project:view'];
  const [selectedPermissions, setSelectedPermissions] = useState<ProjectPermission[]>(defaultPerms);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push(`/${organisationName}/roles`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state?.success, organisationName, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {role ? 'Edit role' : 'Create a new role'}
      </h2>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title={role ? 'Role updated' : 'Role created'} icon={RiCheckboxCircleFill} className="mb-4">
          Redirecting to roles page…
        </Callout>
      )}

      <form action={formAction} className="space-y-5">
        {role && <input type="hidden" name="roleId" value={role.id} />}

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required={!role?.isBuiltIn}
            defaultValue={role?.name ?? ''}
            placeholder="e.g. Reviewer"
            hasError={!!state?.fieldErrors?.name}
            disabled={pending || !!state?.success || role?.isBuiltIn}
          />
          {role?.isBuiltIn && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Built-in role names cannot be changed.</p>
          )}
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
            defaultValue={role?.description ?? ''}
            placeholder="Optional description"
            disabled={pending || !!state?.success}
          />
          {state?.fieldErrors?.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="rank">Rank</Label>
          <Input
            id="rank"
            name="rank"
            type="number"
            min={0}
            defaultValue={role?.rank ?? 10}
            placeholder="e.g. 10"
            disabled={pending || !!state?.success}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Lower rank = higher privilege. Built-in roles use 0–3.
          </p>
        </div>

        <div>
          <Label>Permissions</Label>
          <div className="mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <PermissionGrid
              permissions={selectedPermissions}
              onChange={setSelectedPermissions}
            />
          </div>
          {selectedPermissions.map((perm) => (
            <input key={perm} type="hidden" name={`perm_${perm}`} value="on" />
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="light"
            onClick={() => router.push(`/${organisationName}/roles`)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !!state?.success}>
            {pending ? (role ? 'Saving…' : 'Creating…') : (role ? 'Save changes' : 'Create role')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
