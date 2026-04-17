'use client';

import { useActionState } from 'react';
import { updateSharePermission, type UpdateSharePermissionState } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';

const initialState: UpdateSharePermissionState = {};

interface ChangeSharePermissionFormProps {
  shareId: string;
  currentPermission: string;
}

export default function ChangeSharePermissionForm({
  shareId,
  currentPermission,
}: ChangeSharePermissionFormProps) {
  const boundAction = updateSharePermission.bind(null, shareId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Select name="permission" defaultValue={currentPermission} disabled={pending}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VIEW">VIEW</SelectItem>
          <SelectItem value="CONTRIBUTE">CONTRIBUTE</SelectItem>
          <SelectItem value="MANAGE">MANAGE</SelectItem>
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
