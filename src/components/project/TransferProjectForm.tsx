'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferProject } from '@/actions/project-share';
import type { TransferProjectState } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Callout } from '@/components/common/Callout';
import { RiErrorWarningLine } from '@remixicon/react';

interface TransferProjectFormProps {
  projectId: string;
  projectName: string;
}

const initialState: TransferProjectState = {};

export default function TransferProjectForm({ projectId, projectName }: TransferProjectFormProps) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState('');

  const boundAction = transferProject.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.success && state.newOrgName) {
    router.push(`/${state.newOrgName}`);
    return null;
  }

  const confirmMatches = confirmName === projectName;

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="targetSlug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Target organisation slug
        </label>
        <Input
          id="targetSlug"
          name="targetSlug"
          placeholder="target-org-slug"
          hasError={!!state.fieldErrors?.targetSlug}
        />
        {state.fieldErrors?.targetSlug && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.targetSlug}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmProjectName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Type <span className="font-mono font-semibold">{projectName}</span> to confirm
        </label>
        <Input
          id="confirmProjectName"
          name="confirmProjectName"
          placeholder={projectName}
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
        />
      </div>

      {state.error && (
        <Callout variant="error" title="Transfer failed" icon={RiErrorWarningLine}>
          {state.error}
        </Callout>
      )}

      <Button
        type="submit"
        variant="destructive"
        disabled={!confirmMatches || isPending}
        isLoading={isPending}
      >
        Transfer project
      </Button>
    </form>
  );
}
