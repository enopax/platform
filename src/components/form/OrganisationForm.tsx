'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Textarea } from '@/components/common/Textarea';
import { Switch } from '@/components/common/Switch';
import ClientDate from '@/components/common/ClientDate';
import UserSearch from '@/components/search/UserSearch';
import { type Organisation, type User } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createOrganisation, type CreateOrganisationState,
  updateOrganisation, type UpdateOrganisationState,
} from '@/actions/organisation';

type OrganisationWithOwner = Organisation & {
  owner: User;
};


// Form state that matches both create and update action return types
type OrganisationFormState = CreateOrganisationState | UpdateOrganisationState;

// Initial state for form
const initialState: OrganisationFormState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
};

interface OrganisationFormProps {
  organisation?: OrganisationWithOwner;
  onSuccess?: () => void;
  successMessage?: string;
}

export default function OrganisationForm({ 
  organisation, 
  onSuccess,
  successMessage
}: OrganisationFormProps) {
  const action = organisation ? updateOrganisation : createOrganisation;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(organisation?.owner || null);
  const router = useRouter();

  const isCreate = !organisation;
  const isUpdate = !!organisation;

  useEffect(() => {
    if (state.success) {
      if (onSuccess) {
        onSuccess();
      } else if (isCreate) {
        setTimeout(() => {
          router.push('/admin/organisation');
        }, 2000);
      }
    }
  }, [state.success, router, onSuccess, isCreate]);

  const getSuccessMessage = () => {
    if (successMessage) return successMessage;
    return isCreate ? 'Organisation created successfully! Redirecting to organisations list...' : 'Organisation updated successfully!';
  };

  const getErrorTitle = () => {
    return isCreate ? 'Creation Failed' : 'Update Failed';
  };

  const getSubmitButtonText = () => {
    if (isPending) {
      return isCreate ? 'Creating...' : 'Updating...';
    }
    return isCreate ? 'Create Organisation' : 'Update Organisation';
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field for organisation ID when updating */}
      {organisation && (
        <input type="hidden" name="organisationId" value={organisation.id} />
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
            Organisation Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={organisation?.name || ''}
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder="Enter organisation name"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={organisation?.description || ''}
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Describe what this organisation does..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="website">
            Website
          </Label>
          <Input
            type="url"
            id="website"
            name="website"
            defaultValue={organisation?.website || ''}
            className="mt-1"
            hasError={!!state.fieldErrors?.website}
            placeholder="https://example.com"
          />
          {state.fieldErrors?.website && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.website}</p>
          )}
        </div>

        <div>
          <Label htmlFor="ownerId">
            Owner *
          </Label>
          <div className="mt-1">
            <UserSearch
              placeholder="Search for organisation owner..."
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

        {isUpdate && (
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={organisation?.isActive ?? true}
              />
              <Label htmlFor="isActive">
                Organisation is Active
              </Label>
            </div>
          </div>
        )}
      </div>

      {isUpdate && organisation && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <strong>Created:</strong> <ClientDate date={organisation.createdAt} format="time" />
            </div>
            <div>
              <strong>Updated:</strong> <ClientDate date={organisation.updatedAt} format="time" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="submit" disabled={isPending || (state.success && isCreate)}>
          {getSubmitButtonText()}
        </Button>
      </div>
    </form>
  );
}