'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import ColorPicker from '@/components/common/ColorPicker';
import UserSearch from '@/components/search/UserSearch';
import { createTeam, type CreateTeamState } from '@/actions/team';
import { RiTeamLine, RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type User } from '@prisma/client';

interface Organisation {
  id: string;
  name: string;
  description?: string | null;
}

interface CreateTeamFormProps {
  organisations: Organisation[];
  currentUserId: string;
}

export default function CreateTeamForm({ organisations, currentUserId }: CreateTeamFormProps) {
  const router = useRouter();
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [state, formAction, isPending] = useActionState<CreateTeamState, FormData>(
    createTeam,
    {}
  );

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        router.push('/main/teams');
      }, 1500);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Success Message */}
      {state.success && (
        <Callout
          title="Success"
          variant="success"
          icon={RiCheckLine}
        >
          Team created successfully! Redirecting to teams...
        </Callout>
      )}

      {/* Error Message */}
      {state.error && (
        <Callout
          title="Creation Failed"
          variant="error"
          icon={RiErrorWarningLine}
        >
          {state.error}
        </Callout>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">
            Team Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder="Enter team name"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        {/* Organisation */}
        <div>
          <Label htmlFor="organisationId">
            Organisation *
          </Label>
          <Select name="organisationId" required>
            <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.organisationId}>
              <SelectValue placeholder="Select organisation" />
            </SelectTrigger>
            <SelectContent>
              {organisations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.organisationId && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.organisationId}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Describe the team's purpose and responsibilities..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

        {/* Team Color */}
        <div>
          <Label htmlFor="color">
            Team Color
          </Label>
          <ColorPicker
            name="color"
            id="color"
            defaultValue="#3B82F6"
            hasError={!!state.fieldErrors?.color}
            className="mt-1"
          />
          <p className="mt-1 text-sm text-gray-500">
            Choose a color to help identify this team in the interface
          </p>
          {state.fieldErrors?.color && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.color}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
        >
          <RiTeamLine className="w-4 h-4 mr-2" />
          {isPending ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}