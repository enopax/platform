'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Switch } from '@/components/common/Switch';
import ClientDate from '@/components/common/ClientDate';
import { DatePicker } from '@/components/common/DatePicker';
import TeamSearch from '@/components/search/TeamSearch';
import { type Project, type User, type Organisation, type Team } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createProject, type CreateProjectState,
  updateProject, type UpdateProjectState,
} from '@/actions/project';

type ProjectWithDetails = Project & {
  team: Team & {
    owner: User;
    organisation: Organisation;
  };
  organisation: Organisation;
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
  organisations: Organisation[];
  onSuccess?: () => void;
  successMessage?: string;
  redirectUrl?: string;
}

export default function ProjectForm({ 
  project,
  organisations,
  onSuccess,
  successMessage,
  redirectUrl
}: ProjectFormProps) {
  const action = project ? updateProject : createProject;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedTeam, setSelectedTeam] = useState<Team & { owner: User; organisation: Organisation } | null>(project?.team || null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
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
          <Label htmlFor="organisationId">
            Organisation *
          </Label>
          <Select name="organisationId" defaultValue={project?.organisationId || ''} required>
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
          <Label htmlFor="teamId">
            Assigned Team *
          </Label>
          <div className="mt-1">
            <TeamSearch
              placeholder="Search for team..."
              defaultValue={selectedTeam}
              setResult={setSelectedTeam}
              name="teamId"
              required
              hasError={!!state.fieldErrors?.teamId}
            />
          </div>
          {state.fieldErrors?.teamId && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.teamId}</p>
          )}
        </div>

        <div className="md:col-span-2">
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