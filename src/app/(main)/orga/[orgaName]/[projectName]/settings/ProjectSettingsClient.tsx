'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProjectForm from '@/components/form/ProjectForm';
import { useProject } from '@/contexts/ProjectContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { RiSettingsLine, RiProjectorLine } from '@remixicon/react';
import Link from 'next/link';

interface ProjectSettingsClientProps {
  currentUserId: string;
}

export default function ProjectSettingsClient({ currentUserId }: ProjectSettingsClientProps) {
  const project = useProject();
  const organisation = useOrganisation();
  const orgName = organisation.name;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'PLANNING':
        return 'outline';
      case 'ON_HOLD':
        return 'outline';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'default';
      case 'HIGH':
        return 'secondary';
      case 'MEDIUM':
        return 'outline';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: organisation.name, href: `/orga/${organisation.name}` },
            { label: project.name, href: `/orga/${organisation.name}/${project.name}` },
            { label: 'Settings' }
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
            <RiSettingsLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Settings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage settings and configuration for {project.name}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Project Settings Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                  <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Project Configuration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update project information and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ProjectForm
                project={project}
                successMessage="Project updated successfully!"
                currentUserId={currentUserId}
                redirectUrl={`/orga/${orgName}/${project.name}`}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar - Project Overview */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Overview</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{organisation.name}</span>
              </div>

              <div>
                <span className="text-gray-500">Progress:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{project.progress}%</span>
              </div>

              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(project.updatedAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {project.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{project.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/orga/${orgName}/${project.name}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiProjectorLine className="mr-2 h-4 w-4" />
                  View Project Details
                </Button>
              </Link>
              <Link href={`/orga/${orgName}/${project.name}/add-resource`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiProjectorLine className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
