'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import { useProject } from '@/contexts/ProjectContext';
import { useResource } from '@/contexts/ResourceContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import DeploymentStatus from '@/components/resource/DeploymentStatus';
import ResourceApiTestPanel from '@/components/resource-api/ResourceApiTestPanel';
import ResourcesHealthDashboard from '@/components/dashboard/ResourcesHealthDashboard';
import {
  RiServerLine,
  RiDatabaseLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine,
  RiInformationLine
} from '@remixicon/react';

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
        <Breadcrumbs
          items={[
            { label: organisation.name, href: `/orga/${organisation.name}` },
            { label: project.name, href: `/orga/${organisation.name}/${project.name}` },
            { label: resource.name }
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
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

      {/* Deployment Status */}
      <DeploymentStatus
        resourceId={resource.id}
        status={resource.status}
        configuration={resource.configuration}
        endpoint={resource.endpoint}
        credentials={resource.credentials}
      />

      {/* Health Dashboard Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resource Health
        </h2>
        <ResourcesHealthDashboard
          resources={[
            {
              id: resource.id,
              name: resource.name,
              type: (resource.type as 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'NETWORK') || 'DATABASE',
              status: 'HEALTHY',
              projectId: project.id,
              projectName: project.name,
              lastChecked: new Date(),
            }
          ]}
        />
      </div>

      {/* API Test Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          API Testing
        </h2>
        <Card className="p-6">
          <ResourceApiTestPanel
            organisationName={organisation.name}
            projects={[{ id: project.id, name: project.name }]}
            userId={resource.ownerId}
          />
        </Card>
      </div>
    </div>
  );
}
