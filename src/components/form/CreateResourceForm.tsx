'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Checkbox } from '@/components/common/Checkbox';
import { Slider } from '@/components/common/Slider';
import TeamSearch from '@/components/search/TeamSearch';
import { createResource, type CreateResourceState } from '@/actions/resource';
import { RiDatabase2Line, RiCheckLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Team } from '@prisma/client';

interface CreateResourceFormProps {
  currentUserId: string;
}

// Storage size options in GB
const STORAGE_OPTIONS = [
  { value: 1, label: '1 GB', bytes: 1024 * 1024 * 1024 },
  { value: 5, label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
  { value: 10, label: '10 GB', bytes: 10 * 1024 * 1024 * 1024 },
  { value: 25, label: '25 GB', bytes: 25 * 1024 * 1024 * 1024 },
  { value: 50, label: '50 GB', bytes: 50 * 1024 * 1024 * 1024 },
  { value: 100, label: '100 GB', bytes: 100 * 1024 * 1024 * 1024 },
  { value: 250, label: '250 GB', bytes: 250 * 1024 * 1024 * 1024 },
  { value: 500, label: '500 GB', bytes: 500 * 1024 * 1024 * 1024 },
  { value: 1000, label: '1 TB', bytes: 1000 * 1024 * 1024 * 1024 },
];

export default function CreateResourceForm({ currentUserId }: CreateResourceFormProps) {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [storageSize, setStorageSize] = useState([2]); // Default to 5 GB (index 1)
  const [state, formAction, isPending] = useActionState<CreateResourceState, FormData>(
    createResource,
    {}
  );

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        router.push('/main/resources');
      }, 1500);
    }
  }, [state.success, router]);

  const selectedStorageOption = STORAGE_OPTIONS[storageSize[0]];

  return (
    <form action={formAction} className="space-y-6">
      {/* Success Message */}
      {state.success && (
        <Callout
          title="Success"
          variant="success"
          icon={RiCheckLine}
        >
          Resource created successfully! Redirecting...
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

      <div className="space-y-6">
        {/* Storage Name */}
        <div>
          <Label htmlFor="name">
            Storage Space Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder="My IPFS Storage"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        {/* Storage Size Slider */}
        <div>
          <Label htmlFor="storageSize">
            Storage Size: {selectedStorageOption.label}
          </Label>
          <div className="mt-3 px-2">
            <Slider
              value={storageSize}
              onValueChange={setStorageSize}
              max={STORAGE_OPTIONS.length - 1}
              min={0}
              step={1}
              className="w-full"
              ariaLabelThumb="Storage size selector"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
            <span>1 GB</span>
            <span>1 TB</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Selected: <strong>{selectedStorageOption.label}</strong> of IPFS storage space
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description (Optional)
          </Label>
          <Input
            type="text"
            id="description"
            name="description"
            hasError={!!state.fieldErrors?.description}
            className="mt-1"
            placeholder="Describe what you'll store here..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

        {/* Team Sharing */}
        <div>
          <div className="flex items-start space-x-3 mb-4">
            <Checkbox
              id="isShared"
              checked={isShared}
              onCheckedChange={(checked) => setIsShared(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="isShared" className="text-sm font-medium leading-none">
                Share with a team
              </Label>
              <p className="text-xs text-gray-500">
                Allow team members to access and manage this storage space
              </p>
            </div>
          </div>

          {isShared && (
            <div>
              <Label htmlFor="teamId">
                Select Team
              </Label>
              <div className="mt-1">
                <TeamSearch
                  placeholder="Search for team to share with..."
                  defaultValue={selectedTeam}
                  setResult={setSelectedTeam}
                  name="teamId"
                  hasError={!!state.fieldErrors?.teamId}
                />
              </div>
              {state.fieldErrors?.teamId && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.teamId}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Information Callout */}
      <Callout
        title="IPFS Storage Information"
        variant="note"
        icon={RiInformationLine}
      >
        <div className="text-sm space-y-2">
          <p>• Your files will be distributed across the IPFS network for redundancy</p>
          <p>• Storage space is allocated from your account quota</p>
          <p>• Shared storage allows team members to pin files using this allocation</p>
          <p>• You can always adjust sharing settings later</p>
        </div>
      </Callout>

      {/* Hidden fields */}
      <input type="hidden" name="ownerId" value={currentUserId} />
      <input type="hidden" name="type" value="STORAGE" />
      <input type="hidden" name="status" value="ACTIVE" />
      <input type="hidden" name="quotaLimit" value={selectedStorageOption.bytes.toString()} />
      {!isShared && <input type="hidden" name="teamId" value="" />}

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="light"
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
          <RiDatabase2Line className="w-4 h-4 mr-2" />
          {isPending ? 'Creating...' : 'Create Storage Space'}
        </Button>
      </div>
    </form>
  );
}