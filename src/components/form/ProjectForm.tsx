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
  preselectedTeamId?: string;
  organisationId?: string;
}

// Project type options based on cloud provider research
const PROJECT_TYPES = [
  { value: 'web-app', label: 'Web Application', description: 'Frontend applications, websites, dashboards' },
  { value: 'api', label: 'API Service', description: 'Backend APIs, microservices, REST/GraphQL services' },
  { value: 'mobile-app', label: 'Mobile Application', description: 'iOS, Android, or cross-platform mobile apps' },
  { value: 'data-project', label: 'Data Project', description: 'Analytics, ETL, data processing, ML models' },
  { value: 'infrastructure', label: 'Infrastructure', description: 'DevOps, deployment, monitoring, tooling' },
  { value: 'other', label: 'Other', description: 'Custom or mixed-purpose projects' },
];

export default function ProjectForm({
  project,
  teams,
  onSuccess,
  successMessage,
  redirectUrl,
  currentUserId,
  preselectedTeamId,
  organisationId
}: ProjectFormProps) {
  const action = project ? updateProject : createProject;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );
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

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field for project ID when updating */}
      {project && (
        <input type="hidden" name="projectId" value={project.id} />
      )}

      {/* Hidden field for user ID */}
      {currentUserId && (
        <input type="hidden" name="currentUserId" value={currentUserId} />
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
        {/* Project Name */}
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

        {/* Team and Project Type - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="teamId">
              Assign Team (Optional)
            </Label>
            <Select
              name="teamId"
              defaultValue={project?.teamId || preselectedTeamId || ''}
            >
              <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.teamId}>
                <SelectValue placeholder="Select team or skip for now" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">
                  <span className="text-gray-500 italic">Skip for now</span>
                </SelectItem>
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
            <Label htmlFor="projectType">
              Project Type
            </Label>
            <Select name="projectType" defaultValue={project?.projectType || 'web-app'}>
              <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.projectType}>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium text-left">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.projectType && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.projectType}</p>
            )}
          </div>
        </div>

        {/* Development Toggle */}
        <div>
          <div className="flex items-center space-x-2">
            <Switch
              id="development"
              name="development"
              defaultChecked={project?.development ?? false}
            />
            <Label htmlFor="development">
              Development Project
            </Label>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Development projects are for testing and experimentation
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={project?.description || ''}
            rows={3}
            className="mt-1"
            hasError={!!state.fieldErrors?.description}
            placeholder="Brief description of the project (optional)..."
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.description}</p>
          )}
        </div>
      </div>


      {/* Hidden fields with smart defaults for simplified creation */}
      {isCreate && (
        <>
          <input type="hidden" name="status" value="PLANNING" />
          <input type="hidden" name="priority" value="MEDIUM" />
          <input type="hidden" name="progress" value="0" />
          <input type="hidden" name="currency" value="USD" />
          {organisationId && (
            <input type="hidden" name="organisationId" value={organisationId} />
          )}
        </>
      )}

      {/* Update-only fields */}
      {isUpdate && (
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="md:col-span-2">
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
          </div>

          <div className="mt-6">
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
        </div>
      )}

      {isUpdate && project && (
        <div className="pt-6">
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

      <div className="flex justify-end space-x-4 pt-6">
        <Button type="submit" disabled={isPending || (state.success && isCreate)}>
          {getSubmitButtonText()}
        </Button>
      </div>
    </form>
  );
}