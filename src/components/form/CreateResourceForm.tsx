'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Slider } from '@/components/common/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { createResource, type CreateResourceState } from '@/actions/resource';
import { RiDatabase2Line, RiCheckLine, RiErrorWarningLine, RiServerLine, RiCloudLine, RiCodeLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CreateResourceFormProps {
  currentUserId: string;
  projectId?: string;
  projectName?: string;
  organisationName: string;
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

type ResourceType = 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'API' | 'NETWORK' | 'OTHER';

// Resource type configuration
const RESOURCE_TYPES = [
  {
    value: 'STORAGE' as ResourceType,
    label: 'IPFS Storage',
    description: 'Distributed file storage on IPFS network',
    icon: RiDatabase2Line,
    iconColor: 'text-blue-500',
    available: true,
  },
  {
    value: 'COMPUTE' as ResourceType,
    label: 'Compute Resources',
    description: 'Virtual machines and processing power',
    icon: RiServerLine,
    iconColor: 'text-green-500',
    available: false,
  },
  {
    value: 'DATABASE' as ResourceType,
    label: 'Database Services',
    description: 'Managed database instances',
    icon: RiCloudLine,
    iconColor: 'text-purple-500',
    available: false,
  },
  {
    value: 'API' as ResourceType,
    label: 'API Services',
    description: 'External API access and integrations',
    icon: RiCodeLine,
    iconColor: 'text-orange-500',
    available: false,
  },
];

export default function CreateResourceForm({ currentUserId, projectId, projectName, organisationName }: CreateResourceFormProps) {
  const router = useRouter();
  const [resourceType, setResourceType] = useState<ResourceType>('STORAGE');
  const [storageSize, setStorageSize] = useState([1]); // Default to 5 GB (index 1)
  const [resourceName, setResourceName] = useState<string>('');
  const [state, formAction, isPending] = useActionState<CreateResourceState, FormData>(
    createResource,
    {}
  );

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        if (projectId && projectName && resourceName) {
          // Redirect to resource page if created from project context
          router.push(`/orga/${organisationName}/${projectName}/${resourceName}`);
        } else if (projectId && projectName) {
          // Redirect to project page if no resource name
          router.push(`/orga/${organisationName}/${projectName}`);
        } else {
          // Redirect to organisation page if no project context
          router.push(`/orga/${organisationName}`);
        }
        router.refresh();
      }, 1500);
    }
  }, [state.success, router, projectId, projectName, resourceName, organisationName]);

  const selectedStorageOption = STORAGE_OPTIONS[storageSize[0]];
  const selectedResourceType = RESOURCE_TYPES.find(type => type.value === resourceType);

  // IPFS Storage Configuration Component
  const StorageConfig = () => (
    <>
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
    </>
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Success Message */}
      {state.success && (
        <Callout
          title="Success"
          variant="success"
          icon={RiCheckLine}
        >
          Resource created successfully{projectName ? ` for ${projectName}` : ''}! Redirecting...
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
        {/* Resource Type Selection */}
        <div>
          <Label htmlFor="type">
            Resource Type *
          </Label>
          <Select value={resourceType} onValueChange={(value) => setResourceType(value as ResourceType)}>
            <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.type}>
              <SelectValue placeholder="Select resource type" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    disabled={!type.available}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-5 h-5 ${type.available ? type.iconColor : 'text-gray-400'}`}
                      />
                      <div>
                        <div className={`font-medium text-left ${type.available ? '' : 'text-gray-400'}`}>
                          {type.label}
                        </div>
                        <div className={`text-sm ${type.available ? 'text-gray-500' : 'text-gray-400'}`}>
                          {type.available ? type.description : 'Coming soon'}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {state.fieldErrors?.type && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.type}</p>
          )}
        </div>

        {/* Resource Name */}
        <div>
          <Label htmlFor="name">
            {selectedResourceType?.label || 'Resource'} Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder={`My ${selectedResourceType?.label || 'Resource'}`}
            onChange={(e) => setResourceName(e.target.value)}
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        {/* Resource Type Specific Configuration */}
        {resourceType === 'STORAGE' && <StorageConfig />}

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
            placeholder={resourceType === 'STORAGE' ? 'Describe what you\'ll store here...' : 'Describe this resource...'}
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

      </div>

      {/* Hidden fields */}
      <input type="hidden" name="ownerId" value={currentUserId} />
      <input type="hidden" name="type" value={resourceType} />
      <input type="hidden" name="status" value="ACTIVE" />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      <input type="hidden" name="organisationName" value={organisationName} />
      {resourceType === 'STORAGE' && (
        <input type="hidden" name="quotaLimit" value={selectedStorageOption.bytes.toString()} />
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6">
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
          {selectedResourceType && (
            <selectedResourceType.icon className="w-4 h-4 mr-2" />
          )}
          {isPending ? 'Creating...' : 'Create Resource'}
        </Button>
      </div>
    </form>
  );
}