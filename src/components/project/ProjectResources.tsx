'use client';

import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useState } from 'react';
import {
  RiServerLine,
  RiDatabaseLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine,
  RiAddLine,
  RiLinkUnlink
} from '@remixicon/react';
import { removeResourceFromProject } from '@/actions/resource';
import { useRouter } from 'next/navigation';

type ResourceType = 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'API' | 'OTHER';
type ResourceStatus = 'PROVISIONING' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';

interface ProjectResource {
  id: string;
  quotaLimit: bigint | null;
  resource: {
    id: string;
    name: string;
    description: string | null;
    type: ResourceType;
    status: ResourceStatus;
    endpoint: string | null;
    quotaLimit: bigint | null;
    currentUsage: bigint;
  };
}

interface ProjectResourcesProps {
  resources: ProjectResource[];
  projectId: string;
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

export default function ProjectResources({ resources, projectId, orgName, canManage }: ProjectResourcesProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemoveResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to remove this resource allocation from the project?')) {
      return;
    }

    setRemoving(resourceId);
    try {
      const result = await removeResourceFromProject(resourceId, projectId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove resource:', error);
      alert('Failed to remove resource allocation');
    } finally {
      setRemoving(null);
    }
  };

  if (resources.length === 0) {
    return (
      <Card className="p-12 text-center">
        <RiHardDriveLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No resources allocated
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Allocate resources from your organisation to this project.
        </p>
        {canManage && (
          <Button>
            <RiAddLine className="mr-2 h-4 w-4" />
            Allocate Resource
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((allocation) => {
        const resource = allocation.resource;
        const typeConfig = RESOURCE_TYPE_CONFIG[resource.type];
        const statusConfig = STATUS_CONFIG[resource.status];
        const Icon = typeConfig.icon;

        const resourceUsagePercentage = resource.quotaLimit
          ? Math.min(Math.round((Number(resource.currentUsage) / Number(resource.quotaLimit)) * 100), 100)
          : 0;

        const allocationUsagePercentage = allocation.quotaLimit
          ? Math.min(Math.round((Number(resource.currentUsage) / Number(allocation.quotaLimit)) * 100), 100)
          : 0;

        return (
          <Card key={allocation.id} className="p-6 hover:shadow-md transition-shadow">
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {resource.name}
                    </h3>
                    <Badge variant={statusConfig.variant} className="text-xs">
                      {statusConfig.label}
                    </Badge>
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
                    {resource.endpoint && (
                      <span className="flex items-center gap-1 font-mono text-xs truncate max-w-xs">
                        <RiGlobalLine className="h-4 w-4" />
                        {resource.endpoint}
                      </span>
                    )}
                  </div>

                  {/* Project Quota (if different from resource quota) */}
                  {allocation.quotaLimit && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Project Quota</span>
                        <span>
                          {formatBytes(resource.currentUsage)} / {formatBytes(allocation.quotaLimit)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            allocationUsagePercentage >= 90
                              ? 'bg-red-500'
                              : allocationUsagePercentage >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${allocationUsagePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Resource Total Usage */}
                  {resource.quotaLimit && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Total Resource Usage</span>
                        <span>
                          {formatBytes(resource.currentUsage)} / {formatBytes(resource.quotaLimit)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-400 transition-all"
                          style={{ width: `${resourceUsagePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveResource(resource.id)}
                    disabled={removing === resource.id}
                  >
                    {removing === resource.id ? (
                      'Removing...'
                    ) : (
                      <>
                        <RiLinkUnlink className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
