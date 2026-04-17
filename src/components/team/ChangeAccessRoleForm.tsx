'use client';

import { useActionState } from 'react';
import { updateProjectAccessRole, type UpdateProjectAccessRoleState } from '@/actions/team';
import { Button } from '@/components/common/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';

const initialState: UpdateProjectAccessRoleState = {};

interface ChangeAccessRoleFormProps {
  accessId: string;
  currentRole: string;
}

export default function ChangeAccessRoleForm({ accessId, currentRole }: ChangeAccessRoleFormProps) {
  const boundAction = updateProjectAccessRole.bind(null, accessId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Select name="role" defaultValue={currentRole} disabled={pending}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VIEWER">VIEWER</SelectItem>
          <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
          <SelectItem value="DEPLOYER">DEPLOYER</SelectItem>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" variant="light" className="h-8 text-sm px-3" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {state?.error && (
        <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>
      )}
      {state?.success && (
        <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
      )}
    </form>
  );
}
