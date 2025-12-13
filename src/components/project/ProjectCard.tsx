'use client';

import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  RiServerLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiDatabaseLine,
  RiCodeLine,
  RiMoreLine,
} from '@remixicon/react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    progress: number;
    createdAt: Date;
    allocatedResources: Array<{
      resource: {
        type: string;
        currentUsage?: number;
        quotaLimit?: number;
      };
    }>;
  };
  organisationName: string;
}

export default function ProjectCard({ project, organisationName }: ProjectCardProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const totalUsage = project.allocatedResources.reduce((sum, allocation) => {
    return sum + Number(allocation.resource.currentUsage || 0);
  }, 0);

  const totalQuota = project.allocatedResources.reduce((sum, allocation) => {
    return sum + Number(allocation.resource.quotaLimit || 0);
  }, 0);

  const usagePercentage = totalQuota > 0 ? Math.round((totalUsage / totalQuota) * 100) : 0;

  const typeConfig: Record<string, { icon: any; color: string }> = {
    COMPUTE: { icon: RiServerLine, color: 'text-blue-500' },
    STORAGE: { icon: RiHardDriveLine, color: 'text-purple-500' },
    NETWORK: { icon: RiGlobalLine, color: 'text-green-500' },
    DATABASE: { icon: RiDatabaseLine, color: 'text-orange-500' },
    API: { icon: RiCodeLine, color: 'text-pink-500' },
    OTHER: { icon: RiMoreLine, color: 'text-gray-500' }
  };

  const typeMap: Record<string, number> = {};
  project.allocatedResources.forEach(allocation => {
    const type = allocation.resource.type;
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  return (
    <Link
      href={`/orga/${organisationName}/${project.name}`}
      className="block"
    >
      <Card className="p-6 hover:shadow-lg transition-shadow h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
            {project.name}
          </h3>
          <Badge
            variant={project.status === 'ACTIVE' ? 'success' : 'warning'}
            className="text-xs ml-2 flex-shrink-0"
          >
            {project.status}
          </Badge>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {project.description}
          </p>
        )}

        {/* Resources Section */}
        {project.allocatedResources.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <RiServerLine className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {project.allocatedResources.length} resource{project.allocatedResources.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Resource Types */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(typeMap).map(([type, count]) => {
                const config = typeConfig[type] || typeConfig['OTHER'];
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                    <Icon className={`h-3 w-3 ${config.color}`} />
                    <span className="text-gray-600 dark:text-gray-400">
                      {count} {type.charAt(0) + type.slice(1).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created {new Date(project.createdAt).toLocaleDateString('en-GB')}
          </div>
        </div>
      </Card>
    </Link>
  );
}
