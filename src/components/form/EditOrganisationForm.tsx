'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Card } from '@/components/common/Card';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Badge } from '@/components/common/Badge';
import { 
  RiBuildingLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiUserLine,
  RiTeamLine,
  RiProjectorLine
} from '@remixicon/react';
import { updateOrganisation } from '@/actions/organisation';
import { type Organisation, type User } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OrganisationWithDetails = Organisation & {
  owner: User;
  _count: {
    members: number;
    teams: number;
    projects: number;
  };
};

interface EditOrganisationFormProps {
  organisation: OrganisationWithDetails;
  userId: string;
  isAdmin?: boolean;
}

export default function EditOrganisationForm({ organisation, userId, isAdmin }: EditOrganisationFormProps) {
  const [state, formAction, isPending] = useActionState(updateOrganisation.bind(null, organisation.id), null);
  const router = useRouter();

  // Redirect to organisations page on success
  useEffect(() => {
    if (state?.success) {
      router.push('/main/organisations');
    }
  }, [state?.success, router]);

  return (
    <>
      {/* Organisation Overview */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Organisation Details
        </h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-4">
              <RiBuildingLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {organisation.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Organisation ID: {organisation.id}
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-xs">
            OWNER
          </Badge>
        </div>

        {/* Organisation Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <RiUserLine className="h-4 w-4 text-gray-500 mr-1" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {organisation._count.members}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <RiTeamLine className="h-4 w-4 text-gray-500 mr-1" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {organisation._count.teams}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Teams</p>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="p-8">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-4">
            <RiBuildingLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organisation Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Update your organisation's information
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <Callout variant="error" title="Error" icon={RiErrorWarningFill}>
              {state.error}
            </Callout>
          )}

          {state?.success && (
            <Callout variant="success" title="Success" icon={RiCheckboxCircleFill}>
              Organisation updated successfully! Redirecting...
            </Callout>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Organisation Name
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={organisation.name}
              placeholder="Enter organisation name"
              hasError={!!state?.fieldErrors?.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={organisation.description || ''}
              placeholder="Describe your organisation's purpose and goals"
              rows={4}
              hasError={!!state?.fieldErrors?.description}
            />
            {state?.fieldErrors?.description && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.fieldErrors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="website">
                Website (Optional)
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={organisation.website || ''}
                placeholder="https://example.com"
                hasError={!!state?.fieldErrors?.website}
              />
              {state?.fieldErrors?.website && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.fieldErrors.website}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Contact Email (Optional)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={organisation.email || ''}
                placeholder="contact@organisation.com"
                hasError={!!state?.fieldErrors?.email}
              />
              {state?.fieldErrors?.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone (Optional)
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={organisation.phone || ''}
                placeholder="+1 (555) 123-4567"
                hasError={!!state?.fieldErrors?.phone}
              />
              {state?.fieldErrors?.phone && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address (Optional)
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={organisation.address || ''}
                placeholder="City, State, Country"
                hasError={!!state?.fieldErrors?.address}
              />
              {state?.fieldErrors?.address && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.fieldErrors.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="submit" 
              className="flex-1"
              isLoading={isPending}
            >
              Update Organisation
            </Button>
            <Link href="/main/organisations">
              <Button variant="outline" className="px-6">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {/* Additional Information */}
      <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Organisation Information
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p>• Owner: {organisation.owner.name || organisation.owner.email}</p>
          <p>• Created: {new Date(organisation.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}</p>
          <p>• Last Updated: {new Date(organisation.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}</p>
        </div>
      </Card>
    </>
  );
}