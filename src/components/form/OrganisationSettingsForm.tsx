'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Textarea } from '@/components/common/Textarea';
import { Switch } from '@/components/common/Switch';
import { type Organisation } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrganisation, type UpdateOrganisationState } from '@/actions/organisation';

// Initial state for form
const initialState: UpdateOrganisationState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
};

interface OrganisationSettingsFormProps {
  organisation: Organisation;
  onSuccess?: () => void;
  onClose?: () => void;
  redirectUrl?: string;
}

export default function OrganisationSettingsForm({
  organisation,
  onSuccess,
  onClose,
  redirectUrl
}: OrganisationSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateOrganisation.bind(null, organisation.id),
    initialState
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      if (onSuccess) {
        onSuccess();
      }
      // Auto close after 2 seconds on success, or redirect if URL provided
      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (onClose) {
          onClose();
        }
      }, 2000);
    }
  }, [state.success, onSuccess, onClose, redirectUrl, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Callout
          title="Update Failed"
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
          Organisation updated successfully!
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
            defaultValue={organisation.name || ''}
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
            defaultValue={organisation.description || ''}
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Describe your organisation..."
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
            defaultValue={organisation.website || ''}
            className="mt-1"
            placeholder="https://example.com"
            hasError={!!state.fieldErrors?.website}
          />
          {state.fieldErrors?.website && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.website}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={organisation.email || ''}
            className="mt-1"
            placeholder="contact@example.com"
            hasError={!!state.fieldErrors?.email}
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">
            Phone
          </Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={organisation.phone || ''}
            className="mt-1"
            placeholder="+1 (555) 123-4567"
            hasError={!!state.fieldErrors?.phone}
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address">
            Address
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            defaultValue={organisation.address || ''}
            className="mt-1"
            placeholder="123 Business St, City, State"
            hasError={!!state.fieldErrors?.address}
          />
          {state.fieldErrors?.address && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.address}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={organisation.isActive ?? true}
            />
            <Label htmlFor="isActive">
              Organisation is Active
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || state.success}>
          {isPending ? 'Updating...' : 'Update Organisation'}
        </Button>
      </div>
    </form>
  );
}