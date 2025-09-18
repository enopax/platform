'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Card } from '@/components/common/Card';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { 
  RiBuildingLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill
} from '@remixicon/react';
import { createOrganisation } from '@/actions/organisation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NewOrganisationFormProps {
  userId: string;
}

export default function NewOrganisationForm({ userId }: NewOrganisationFormProps) {
  const [state, formAction, isPending] = useActionState(createOrganisation, null);
  const router = useRouter();

  // Redirect to organisations page on success
  useEffect(() => {
    if (state?.success) {
      router.push('/main/organisations');
    }
  }, [state?.success, router]);

  return (
    <>
      {/* Creation Form */}
      <Card className="p-8">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-4">
            <RiBuildingLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organisation Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You'll become the owner of this organisation
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
              Organisation created successfully! Redirecting...
            </Callout>
          )}

          {/* Hidden field to pass current user as owner */}
          <input type="hidden" name="ownerId" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Organisation Name
            </Label>
            <Input
              id="name"
              name="name"
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
              Create Organisation
            </Button>
            <Link href="/main/organisations">
              <Button variant="outline" className="px-6">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {/* Next Steps Info */}
      <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          What happens next?
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• You'll become the owner of this organisation</li>
          <li>• You can invite team members to join</li>
          <li>• Create teams and projects within the organisation</li>
          <li>• Manage storage allocation and settings</li>
        </ul>
      </Card>
    </>
  );
}