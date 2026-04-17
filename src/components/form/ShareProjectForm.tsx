'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shareProject, type ShareProjectState } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';

const initialState: ShareProjectState = {};

interface ShareProjectFormProps {
  projectId: string;
  organisationName: string;
  projectName: string;
}

export default function ShareProjectForm({
  projectId,
  organisationName,
  projectName,
}: ShareProjectFormProps) {
  const boundAction = shareProject.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Share with another organisation or user
      </h2>

      {state?.error && !state?.fieldErrors && (
        <Callout variant="error" title="Error" icon={RiErrorWarningFill} className="mb-4">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Project shared" icon={RiCheckboxCircleFill} className="mb-4">
          The project has been shared successfully.
        </Callout>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="slug">Organisation or user name</Label>
          <Input
            id="slug"
            name="slug"
            type="text"
            placeholder="Enter organisation or user name"
            disabled={pending}
            className={state?.fieldErrors?.slug ? 'border-red-500' : ''}
          />
          {state?.fieldErrors?.slug && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.slug}</p>
          )}
        </div>

        <div>
          <Label htmlFor="permission">Permission</Label>
          <Select name="permission" defaultValue="VIEW" disabled={pending}>
            <SelectTrigger id="permission" className={state?.fieldErrors?.permission ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEW">VIEW</SelectItem>
              <SelectItem value="CONTRIBUTE">CONTRIBUTE</SelectItem>
              <SelectItem value="MANAGE">MANAGE</SelectItem>
            </SelectContent>
          </Select>
          {state?.fieldErrors?.permission && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.permission}</p>
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
          <Button type="submit" disabled={pending}>
            {pending ? 'Sharing…' : 'Share project'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
