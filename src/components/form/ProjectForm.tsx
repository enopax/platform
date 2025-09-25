'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Switch } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { Slider } from '@/components/common/Slider';
import ClientDate from '@/components/common/ClientDate';
import { DatePicker } from '@/components/common/DatePicker';
import { type Project, type User, type Organisation, type Team } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine, RiDatabase2Line } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createProject, type CreateProjectState,
  updateProject, type UpdateProjectState,
} from '@/actions/project';

// Storage size options for optional resource creation
const STORAGE_OPTIONS = [
  { value: 1, label: '1 GB', bytes: 1024 * 1024 * 1024 },
  { value: 5, label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
  { value: 10, label: '10 GB', bytes: 10 * 1024 * 1024 * 1024 },
  { value: 25, label: '25 GB', bytes: 25 * 1024 * 1024 * 1024 },
  { value: 50, label: '50 GB', bytes: 50 * 1024 * 1024 * 1024 },
  { value: 100, label: '100 GB', bytes: 100 * 1024 * 1024 * 1024 },
];

type ProjectWithDetails = Project & {
  team: Team & {
    owner: User;
    organisation?: Organisation | null;
  };
};

// Form state that matches both create and update action return types
type ProjectFormState = CreateProjectState | UpdateProjectState;

// Initial state for form
const initialState: ProjectFormState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
};

interface ProjectFormProps {
  project?: ProjectWithDetails;
  teams: (Team & { owner: User; organisation?: Organisation | null })[];
  onSuccess?: () => void;
  successMessage?: string;
  redirectUrl?: string;
  currentUserId?: string;
}

export default function ProjectForm({
  project,
  teams,
  onSuccess,
  successMessage,
  redirectUrl,
  currentUserId
}: ProjectFormProps) {
  const action = project ? updateProject : createProject;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );
  // Resource creation states (only for create mode)
  const [createResource, setCreateResource] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [storageSize, setStorageSize] = useState([1]); // Default to 5 GB (index 1)
  const router = useRouter();

  const isCreate = !project;
  const isUpdate = !!project;

  useEffect(() => {
    if (state.success) {
      if (onSuccess) {
        onSuccess();
      } else if (isCreate && redirectUrl) {
        setTimeout(() => {
          router.push(redirectUrl);
        }, 2000);
      } else if (isCreate) {
        setTimeout(() => {
          router.push('/admin/project');
        }, 2000);
      }
    }
  }, [state.success, router, onSuccess, isCreate, redirectUrl]);

  const getSuccessMessage = () => {
    if (successMessage) return successMessage;
    return isCreate ? 'Project created successfully! Redirecting to projects list...' : 'Project updated successfully!';
  };

  const getErrorTitle = () => {
    return isCreate ? 'Creation Failed' : 'Update Failed';
  };

  const getSubmitButtonText = () => {
    if (isPending) {
      return isCreate ? 'Creating...' : 'Updating...';
    }
    return isCreate ? 'Create Project' : 'Update Project';
  };

  const selectedStorageOption = STORAGE_OPTIONS[storageSize[0]];

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field for project ID when updating */}
      {project && (
        <input type="hidden" name="projectId" value={project.id} />
      )}

      {/* Hidden field for user ID when updating */}
      {project && currentUserId && (
        <input type="hidden" name="userId" value={currentUserId} />
      )}
      
      {/* Hidden fields for date picker values */}
      {startDate && (
        <input type="hidden" name="startDate" value={startDate.toISOString().split('T')[0]} />
      )}
      {endDate && (
        <input type="hidden" name="endDate" value={endDate.toISOString().split('T')[0]} />
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

      {/* Essential Fields Section */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="name">
            Project Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={project?.name || ''}
            required
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
            placeholder="Enter project name"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="teamId">
            Team *
          </Label>
          <Select name="teamId" defaultValue={project?.teamId || ''} required>
            <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.teamId}>
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} {team.isPersonal ? '(Personal)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.teamId && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.teamId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={project?.description || ''}
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Describe the project goals, scope, and requirements..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>

        {/* Resource Creation Option (Create Mode Only) */}
        {isCreate && currentUserId && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start space-x-3 mb-4">
              <Checkbox
                id="createResource"
                checked={createResource}
                onCheckedChange={(checked) => setCreateResource(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="createResource" className="text-sm font-medium leading-none">
                  Create an IPFS storage resource with this project
                </Label>
                <p className="text-xs text-gray-500">
                  Get started immediately with distributed storage for your project
                </p>
              </div>
            </div>

            {createResource && (
              <div className="space-y-4 pl-7">
                <div>
                  <Label htmlFor="resourceName">
                    Storage Name
                  </Label>
                  <Input
                    type="text"
                    id="resourceName"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    className="mt-1"
                    placeholder="My Project Storage"
                  />
                </div>

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
                    <span>100 GB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Settings (Expandable) - Only show all fields if updating or if specifically requested */}
      {isUpdate && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="development"
                  name="development"
                  defaultChecked={project?.development ?? false}
                />
                <Label htmlFor="development">
                  Development Project
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                Development projects are for testing and experimentation
              </p>
            </div>

            <div>
              <Label htmlFor="status">
                Status
              </Label>
              <Select name="status" defaultValue={project?.status || 'PLANNING'}>
                <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.status}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {state.fieldErrors?.status && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.status}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">
                Priority
              </Label>
              <Select name="priority" defaultValue={project?.priority || 'MEDIUM'}>
                <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.priority}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {state.fieldErrors?.priority && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.priority}</p>
              )}
            </div>

        <div>
          <Label htmlFor="startDate">
            Start Date
          </Label>
          <div className="mt-1">
            <DatePicker
              placeholder="Select start date"
              value={startDate}
              onChange={setStartDate}
              hasError={!!state.fieldErrors?.startDate}
            />
          </div>
          {state.fieldErrors?.startDate && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startDate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate">
            Target End Date
          </Label>
          <div className="mt-1">
            <DatePicker
              placeholder="Select target end date"
              value={endDate}
              onChange={setEndDate}
              hasError={!!state.fieldErrors?.endDate}
              fromDate={startDate} // Prevent selecting end date before start date
            />
          </div>
          {state.fieldErrors?.endDate && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endDate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="budget">
            Budget
          </Label>
          <Input
            type="number"
            id="budget"
            name="budget"
            step="0.01"
            min="0"
            defaultValue={project?.budget?.toString() || ''}
            className="mt-1"
            placeholder="0.00"
            hasError={!!state.fieldErrors?.budget}
          />
          {state.fieldErrors?.budget && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.budget}</p>
          )}
        </div>

        <div>
          <Label htmlFor="currency">
            Currency
          </Label>
          <Select name="currency" defaultValue={project?.currency || 'USD'}>
            <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.currency}>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="CAD">CAD (C$)</SelectItem>
              <SelectItem value="AUD">AUD (A$)</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.currency && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.currency}</p>
          )}
        </div>

        <div>
          <Label htmlFor="progress">
            Progress (%)
          </Label>
          <Input
            type="number"
            id="progress"
            name="progress"
            min="0"
            max="100"
            defaultValue={project?.progress?.toString() || '0'}
            className="mt-1"
            hasError={!!state.fieldErrors?.progress}
          />
          {state.fieldErrors?.progress && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.progress}</p>
          )}
        </div>

        <div>
          <Label htmlFor="repositoryUrl">
            Repository URL
          </Label>
          <Input
            type="url"
            id="repositoryUrl"
            name="repositoryUrl"
            defaultValue={project?.repositoryUrl || ''}
            className="mt-1"
            placeholder="https://github.com/username/repo"
            hasError={!!state.fieldErrors?.repositoryUrl}
          />
          {state.fieldErrors?.repositoryUrl && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.repositoryUrl}</p>
          )}
        </div>

        <div>
          <Label htmlFor="documentationUrl">
            Documentation URL
          </Label>
          <Input
            type="url"
            id="documentationUrl"
            name="documentationUrl"
            defaultValue={project?.documentationUrl || ''}
            className="mt-1"
            placeholder="https://docs.example.com"
            hasError={!!state.fieldErrors?.documentationUrl}
          />
          {state.fieldErrors?.documentationUrl && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.documentationUrl}</p>
          )}
        </div>

        {isUpdate && (
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={project?.isActive ?? true}
              />
              <Label htmlFor="isActive">
                Project is Active
              </Label>
            </div>
          </div>
        )}
          </div>
        </div>
      )}

      {/* Default values for create mode */}
      {isCreate && (
        <>
          <input type="hidden" name="status" value="PLANNING" />
          <input type="hidden" name="priority" value="MEDIUM" />
          <input type="hidden" name="development" value="false" />
        </>
      )}

      {/* Resource creation hidden fields */}
      {isCreate && createResource && currentUserId && (
        <>
          <input type="hidden" name="createResource" value="true" />
          <input type="hidden" name="resourceName" value={resourceName || 'Project Storage'} />
          <input type="hidden" name="resourceType" value="STORAGE" />
          <input type="hidden" name="quotaLimit" value={selectedStorageOption.bytes.toString()} />
          <input type="hidden" name="resourceOwnerId" value={currentUserId} />
        </>
      )}

      {isUpdate && project && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <strong>Created:</strong> <ClientDate date={project.createdAt} format="time" />
            </div>
            <div>
              <strong>Updated:</strong> <ClientDate date={project.updatedAt} format="time" />
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