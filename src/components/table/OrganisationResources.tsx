'use client';

import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import {
  RiServerLine,
  RiDatabaseLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine,
  RiLinksLine,
  RiEyeLine
} from '@remixicon/react';

type ResourceType = 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'API' | 'OTHER';
type ResourceStatus = 'PROVISIONING' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';

interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: ResourceType;
  status: ResourceStatus;
  endpoint: string | null;
  quotaLimit: bigint | null;
  currentUsage: bigint;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  _count?: {
    allocatedProjects: number;
  };
}

interface OrganisationResourcesProps {
  resources: Resource[];
  orgName: string;
  canManage: boolean;
}

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

function formatBytes(bytes: bigint | number): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function calculateUsagePercentage(current: bigint, limit: bigint | null): number {
  if (!limit) return 0;
  const percentage = (Number(current) / Number(limit)) * 100;
  return Math.min(Math.round(percentage), 100);
}

export default function OrganisationResources({ resources, orgName, canManage }: OrganisationResourcesProps) {
  if (resources.length === 0) {
    return (
      <Card className="p-12 text-center">
        <RiHardDriveLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No resources yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Create your first resource to get started.
        </p>
        {canManage && (
          <Link href={`/main/organisations/${orgName}/resources/new`}>
            <Button>Create Resource</Button>
          </Link>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => {
        const typeConfig = RESOURCE_TYPE_CONFIG[resource.type];
        const statusConfig = STATUS_CONFIG[resource.status];
        const Icon = typeConfig.icon;
        const usagePercentage = calculateUsagePercentage(resource.currentUsage, resource.quotaLimit);

        return (
          <Card key={resource.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              {/* Resource Info */}
              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
                  <Icon className={`h-6 w-6 ${typeConfig.color}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/main/organisations/${orgName}/resources/${resource.id}`}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colours"
                    >
                      {resource.name}
                    </Link>
                    <Badge variant={statusConfig.variant} className="text-xs">
                      {statusConfig.label}
                    </Badge>
                    {resource.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>

                  {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {resource.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <RiServerLine className="h-4 w-4" />
                      {resource.type}
                    </span>
                    {resource._count && (
                      <span className="flex items-center gap-1">
                        <RiLinksLine className="h-4 w-4" />
                        {resource._count.allocatedProjects} {resource._count.allocatedProjects === 1 ? 'project' : 'projects'}
                      </span>
                    )}
                    {resource.endpoint && (
                      <span className="flex items-center gap-1 font-mono text-xs truncate max-w-xs">
                        <RiGlobalLine className="h-4 w-4" />
                        {resource.endpoint}
                      </span>
                    )}
                  </div>

                  {/* Usage Bar */}
                  {resource.quotaLimit && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Usage</span>
                        <span>
                          {formatBytes(resource.currentUsage)} / {formatBytes(resource.quotaLimit)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercentage >= 90
                              ? 'bg-red-500'
                              : usagePercentage >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {resource.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{resource.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/main/organisations/${orgName}/resources/${resource.id}`}>
                    <Button variant="outline" size="sm">
                      <RiEyeLine className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
