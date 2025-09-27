'use client';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RiServerLine, RiDatabase2Line, RiCloudLine, RiWifiLine } from '@remixicon/react';

type ResourceType = 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'NETWORK';
type ResourceStatus = 'HEALTHY' | 'WARNING' | 'ERROR';

interface ResourceUsage {
  current: number;
  total: number;
  percentage: number;
}

interface DashboardResource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  projectId: string;
  projectName: string;
  usage?: ResourceUsage;
  lastChecked: Date;
  responseTime?: number;
}

interface ResourcesHealthDashboardProps {
  resources: DashboardResource[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getResourceIcon(type: ResourceType) {
  switch (type) {
    case 'STORAGE':
      return RiDatabase2Line;
    case 'COMPUTE':
      return RiServerLine;
    case 'DATABASE':
      return RiDatabase2Line;
    case 'NETWORK':
      return RiWifiLine;
    default:
      return RiCloudLine;
  }
}

function getStatusColor(status: ResourceStatus): string {
  switch (status) {
    case 'HEALTHY':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'error';
    default:
      return 'outline';
  }
}

export default function ResourcesHealthDashboard({ resources }: ResourcesHealthDashboardProps) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-8">
        <RiServerLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No resources to monitor
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add resources to your project to see their health status here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {resources.map((resource) => {
        const Icon = getResourceIcon(resource.type);
        return (
          <Card key={resource.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {resource.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {resource.type.toLowerCase()}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusColor(resource.status)} size="sm">
                {resource.status}
              </Badge>
            </div>

            {resource.usage && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Usage</span>
                  <span>{resource.usage.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      resource.usage.percentage > 80
                        ? 'bg-red-500'
                        : resource.usage.percentage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${resource.usage.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formatBytes(resource.usage.current)}</span>
                  <span>{formatBytes(resource.usage.total)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Last check: {resource.lastChecked.toLocaleTimeString()}
              </span>
              {resource.responseTime && (
                <span>{resource.responseTime}ms</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}