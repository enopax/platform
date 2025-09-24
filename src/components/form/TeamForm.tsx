'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Switch } from '@/components/common/Switch';
import ColorPicker from '@/components/common/ColorPicker';
import ClientDate from '@/components/common/ClientDate';
import UserSearch from '@/components/search/UserSearch';
import { type Team, type User, type Organisation } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createTeam, type CreateTeamState,
  updateTeam, type UpdateTeamState,
} from '@/actions/team';

type TeamWithDetails = Team & {
  owner: User;
  organisation: Organisation;
};

// Form state that matches both create and update action return types
type TeamFormState = CreateTeamState | UpdateTeamState;

// Initial state for form
const initialState: TeamFormState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
};

interface TeamFormProps {
  team?: TeamWithDetails;
  organisations: Organisation[];
  onSuccess?: () => void;
  successMessage?: string;
  cancelUrl?: string;
}

export default function TeamForm({
  team,
  organisations,
  onSuccess,
  successMessage,
  cancelUrl = "/main/teams"
}: TeamFormProps) {
  const action = team ? updateTeam : createTeam;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(team?.owner || null);
  const router = useRouter();

  const isCreate = !team;
  const isUpdate = !!team;

  useEffect(() => {
    if (state.success) {
      if (onSuccess) {
        onSuccess();
      } else if (isCreate) {
        setTimeout(() => {
          router.push(cancelUrl);
        }, 2000);
      }
    }
  }, [state.success, router, onSuccess, isCreate, cancelUrl]);

  const getSuccessMessage = () => {
    if (successMessage) return successMessage;
    return isCreate ? 'Team created successfully! Redirecting to teams list...' : 'Team updated successfully!';
  };

  const getErrorTitle = () => {
    return isCreate ? 'Creation Failed' : 'Update Failed';
  };

  const getSubmitButtonText = () => {
    if (isPending) {
      return isCreate ? 'Creating...' : 'Updating...';
    }
    return isCreate ? 'Create Team' : 'Update Team';
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field for team ID when updating */}
      {team && (
        <input type="hidden" name="teamId" value={team.id} />
      )}

      {state.error && (
        <Callout
          title={getErrorTitle()}
          variant="error"
          icon={RiErrorWarningLine}
        >
          {state.error}
        </Callout>
      )}

      {state.success && (
        <Callout
          title="Success"
          variant="success"
          icon={RiCheckLine}
        >
          {getSuccessMessage()}
        </Callout>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="name">
            Team Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={team?.name || ''}
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder="Enter team name"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="organisationId">
            Organisation *
          </Label>
          <Select name="organisationId" defaultValue={team?.organisationId || ''} required>
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

        <div>
          <Label htmlFor="ownerId">
            Team Owner *
          </Label>
          <div className="mt-1">
            <UserSearch
              placeholder="Search for team owner..."
              defaultValue={selectedOwner}
              setResult={setSelectedOwner}
              name="ownerId"
              required
              hasError={!!state.fieldErrors?.ownerId}
            />
          </div>
          {state.fieldErrors?.ownerId && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.ownerId}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={team?.description || ''}
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Describe the team's purpose and responsibilities..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="color">
            Team Color
          </Label>
          <ColorPicker
            name="color"
            id="color"
            defaultValue={team?.color || '#3B82F6'}
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

        {isUpdate && (
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={team?.isActive ?? true}
              />
              <Label htmlFor="isActive">
                Team is Active
              </Label>
            </div>
          </div>
        )}
      </div>

      {isUpdate && team && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <strong>Created:</strong> <ClientDate date={team.createdAt} format="time" />
            </div>
            <div>
              <strong>Updated:</strong> <ClientDate date={team.updatedAt} format="time" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Link href={cancelUrl}>
          <Button type="button" variant="light" disabled={isPending}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending || (state.success && isCreate)}>
          {getSubmitButtonText()}
        </Button>
      </div>
    </form>
  );
}