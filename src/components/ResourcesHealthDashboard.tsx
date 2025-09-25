'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import {
  RiServerLine,
  RiDatabase2Line,
  RiHardDriveLine,
  RiCpuLine,
  RiWifiLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiMoreLine,
  RiRefreshLine,
  RiSettingsLine,
  RiEyeLine
} from '@remixicon/react';
import Link from 'next/link';

interface Resource {
  id: string;
  name: string;
  type: 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'NETWORK';
  status: 'HEALTHY' | 'WARNING' | 'ERROR' | 'OFFLINE';
  projectId: string;
  projectName: string;
  usage?: {
    current: number;
    total: number;
    percentage: number;
  };
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
  };
  lastChecked: Date;
  responseTime?: number;
}

interface ResourcesHealthDashboardProps {
  resources: Resource[];
  className?: string;
}

export default function ResourcesHealthDashboard({
  resources,
  className = ''
}: ResourcesHealthDashboardProps) {
  const getStatusColor = (status: Resource['status']) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 dark:text-green-400';
      case 'WARNING': return 'text-yellow-600 dark:text-yellow-400';
      case 'ERROR': return 'text-red-600 dark:text-red-400';
      case 'OFFLINE': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: Resource['status']) => {
    switch (status) {
      case 'HEALTHY': return <RiCheckboxCircleLine className="w-4 h-4" />;
      case 'WARNING': return <RiAlertLine className="w-4 h-4" />;
      case 'ERROR': return <RiAlertLine className="w-4 h-4" />;
      case 'OFFLINE': return <RiTimeLine className="w-4 h-4" />;
      default: return <RiTimeLine className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: Resource['status']) => {
    switch (status) {
      case 'HEALTHY': return 'success';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'destructive';
      case 'OFFLINE': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'STORAGE': return <RiHardDriveLine className="w-5 h-5" />;
      case 'COMPUTE': return <RiCpuLine className="w-5 h-5" />;
      case 'DATABASE': return <RiDatabase2Line className="w-5 h-5" />;
      case 'NETWORK': return <RiWifiLine className="w-5 h-5" />;
      default: return <RiServerLine className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'STORAGE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPUTE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DATABASE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'NETWORK': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Calculate overview stats
  const totalResources = resources.length;
  const healthyResources = resources.filter(r => r.status === 'HEALTHY').length;
  const warningResources = resources.filter(r => r.status === 'WARNING').length;
  const errorResources = resources.filter(r => r.status === 'ERROR').length;
  const offlineResources = resources.filter(r => r.status === 'OFFLINE').length;

  const healthPercentage = totalResources > 0 ? (healthyResources / totalResources) * 100 : 0;

  // Group resources by project
  const resourcesByProject = resources.reduce((acc, resource) => {
    if (!acc[resource.projectId]) {
      acc[resource.projectId] = {
        projectName: resource.projectName,
        resources: []
      };
    }
    acc[resource.projectId].resources.push(resource);
    return acc;
  }, {} as Record<string, { projectName: string; resources: Resource[] }>);

  if (totalResources === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <RiServerLine className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Resources Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Resources will appear here once they're created within your projects.
        </p>
        <Link href="/main/projects">
          <Button>
            View Projects
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Resources</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalResources}</p>
            </div>
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <RiServerLine className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Healthy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{healthyResources}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <RiCheckboxCircleLine className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Issues</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningResources + errorResources}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <RiAlertLine className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(healthPercentage)}%</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RiArrowUpLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Health Overview Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Overall Health
          </h3>
          <Button variant="outline" size="sm">
            <RiRefreshLine className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">System Health</span>
            <span className="font-medium text-gray-900 dark:text-white">{Math.round(healthPercentage)}%</span>
          </div>
          <ProgressBar value={healthPercentage} className="h-3" />

          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="font-medium text-green-600 dark:text-green-400">{healthyResources}</div>
              <div className="text-gray-500">Healthy</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600 dark:text-yellow-400">{warningResources}</div>
              <div className="text-gray-500">Warning</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600 dark:text-red-400">{errorResources}</div>
              <div className="text-gray-500">Error</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-600 dark:text-gray-400">{offlineResources}</div>
              <div className="text-gray-500">Offline</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resources by Project */}
      <div className="space-y-6">
        {Object.entries(resourcesByProject).map(([projectId, { projectName, resources: projectResources }]) => (
          <Card key={projectId} className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {projectName}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {projectResources.length} resources
                  </Badge>
                </div>
                <Link href={`/main/projects/${projectId}`}>
                  <Button variant="outline" size="sm">
                    <RiEyeLine className="w-4 h-4 mr-2" />
                    View Project
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {projectResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {resource.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {resource.type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={getStatusVariant(resource.status)} className="text-xs">
                        <span className={`inline-flex items-center gap-1 ${getStatusColor(resource.status)}`}>
                          {getStatusIcon(resource.status)}
                          {resource.status}
                        </span>
                      </Badge>
                      {resource.responseTime && (
                        <span className="text-xs text-gray-500">
                          {resource.responseTime}ms
                        </span>
                      )}
                    </div>

                    {resource.usage && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Usage</span>
                          <span>{resource.usage.percentage}%</span>
                        </div>
                        <ProgressBar value={resource.usage.percentage} className="h-1.5" />
                      </div>
                    )}

                    {resource.metrics && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {resource.metrics.cpu !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">CPU</span>
                            <span className="font-medium">{resource.metrics.cpu}%</span>
                          </div>
                        )}
                        {resource.metrics.memory !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Memory</span>
                            <span className="font-medium">{resource.metrics.memory}%</span>
                          </div>
                        )}
                        {resource.metrics.disk !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Disk</span>
                            <span className="font-medium">{resource.metrics.disk}%</span>
                          </div>
                        )}
                        {resource.metrics.network !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Network</span>
                            <span className="font-medium">{resource.metrics.network}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500">
                        Updated {new Date(resource.lastChecked).toLocaleTimeString()}
                      </span>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <RiMoreLine className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Live monitoring</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RiSettingsLine className="w-4 h-4 mr-2" />
              Configure Alerts
            </Button>
            <Button variant="outline" size="sm">
              <RiRefreshLine className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}