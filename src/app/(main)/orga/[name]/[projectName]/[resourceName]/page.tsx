'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import { useProject } from '@/contexts/ProjectContext';
import { useResource } from '@/contexts/ResourceContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { SimpleResourceBreadcrumbs } from '@/components/common/Breadcrumbs';
import {
  RiArrowLeftLine,
  RiServerLine,
  RiDatabaseLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine,
  RiInformationLine
} from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RESOURCE_TYPE_CONFIG = {
  COMPUTE: { icon: RiServerLine, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  STORAGE: { icon: RiHardDriveLine, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  NETWORK: { icon: RiGlobalLine, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  DATABASE: { icon: RiDatabaseLine, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  API: { icon: RiCodeLine, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  OTHER: { icon: RiMoreLine, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/20' }
} as const;

const STATUS_CONFIG = {
  PROVISIONING: { variant: 'warning' as const, label: 'Provisioning' },
  ACTIVE: { variant: 'success' as const, label: 'Active' },
  INACTIVE: { variant: 'outline' as const, label: 'Inactive' },
  MAINTENANCE: { variant: 'warning' as const, label: 'Maintenance' },
  DELETED: { variant: 'outline' as const, label: 'Deleted' }
} as const;

export default function ResourceDetailPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const project = useProject();
  const resource = useResource();

  const typeConfig = RESOURCE_TYPE_CONFIG[resource.type as keyof typeof RESOURCE_TYPE_CONFIG] || RESOURCE_TYPE_CONFIG.OTHER;
  const statusConfig = STATUS_CONFIG[resource.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INACTIVE;
  const IconComponent = typeConfig.icon;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <SimpleResourceBreadcrumbs
          organisationName={organisation.name}
          projectName={project.name}
          resourceName={resource.name}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
              <IconComponent className={`w-8 h-8 ${typeConfig.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {resource.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {resource.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Details Card */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Details
          </h2>

          <div className="space-y-4">
            {resource.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <p className="text-gray-600 dark:text-gray-400">
                  {resource.description}
                </p>
              </div>
            )}

            {resource.endpoint && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endpoint
                </label>
                <code className="block p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-white break-all">
                  {resource.endpoint}
                </code>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <p className="text-gray-600 dark:text-gray-400">
                {resource.type}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <p className="text-gray-600 dark:text-gray-400">
                {statusConfig.label}
              </p>
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Resource Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Project:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {project.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Organisation:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {organisation.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Resource ID:</span>
                <code className="text-xs bg-gray-50 dark:bg-gray-900 rounded px-2 py-1 text-gray-900 dark:text-white break-all">
                  {resource.id}
                </code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
