'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  RiProjectorLine,
  RiAddLine,
  RiCalendarLine,
  RiBarChartLine,
  RiServerLine,
  RiArrowRightLine,
  RiHardDriveLine,
  RiDatabaseLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine
} from '@remixicon/react';
import Link from 'next/link';
import { type Project } from '@prisma/client';

type ProjectWithTeamsAndResources = Project & {
  organisation?: {
    id: string;
    name: string;
  };
  allocatedResources: {
    resource: {
      id: string;
      name: string;
      type: string;
      currentUsage?: number | null;
      quotaLimit?: number | null;
    };
  }[];
};

interface ProjectCardProps {
  project: ProjectWithTeamsAndResources;
  showResourceUsage?: boolean;
  href?: string;
}

const resourceTypeConfig: Record<string, { icon: any; color: string }> = {
  COMPUTE: { icon: RiServerLine, color: 'text-blue-500' },
  STORAGE: { icon: RiHardDriveLine, color: 'text-purple-500' },
  NETWORK: { icon: RiGlobalLine, color: 'text-green-500' },
  DATABASE: { icon: RiDatabaseLine, color: 'text-orange-500' },
  API: { icon: RiCodeLine, color: 'text-pink-500' },
  OTHER: { icon: RiMoreLine, color: 'text-gray-500' }
};

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'COMPLETED': return 'neutral';
    case 'PLANNING': return 'warning';
    case 'ON_HOLD': return 'warning';
    case 'CANCELLED': return 'error';
    default: return 'neutral';
  }
}

function getPriorityBadgeVariant(priority: string) {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'neutral';
    case 'LOW': return 'neutral';
    default: return 'neutral';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

function ProjectCardContent({ project, showResourceUsage }: { project: ProjectWithTeamsAndResources; showResourceUsage: boolean }) {
  const resourceCount = project.allocatedResources?.length || 0;
  const resourceTypes = project.allocatedResources
    ? Array.from(new Set(project.allocatedResources.map(r => r.resource.type)))
    : [];
  const isClickable = showResourceUsage;

  return (
    <Card className={`hover:shadow-lg transition-shadow flex flex-col h-full ${showResourceUsage ? 'p-6 cursor-pointer' : 'p-4'}`}>
      {/* Header with icon and title */}
      <div className={`flex items-start justify-between ${showResourceUsage ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex-shrink-0">
            <RiProjectorLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${showResourceUsage ? 'text-lg' : ''}`}>
              {project.name}
            </h3>
            {project.organisation && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {project.organisation.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs whitespace-nowrap">
            {project.status}
          </Badge>
          {!showResourceUsage && (
            <Badge variant={getPriorityBadgeVariant(project.priority)} className="text-xs whitespace-nowrap">
              {project.priority}
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className={`text-gray-600 dark:text-gray-400 mb-4 ${showResourceUsage ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'}`}>
          {project.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Project Metrics - Definition List (Grid view only) */}
      {!showResourceUsage && (
        <dl className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-xs">
          {project.startDate && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <RiCalendarLine className="w-3 h-3" />
                <span>Started</span>
              </dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                {new Date(project.startDate).toLocaleDateString()}
              </dd>
            </div>
          )}
          {project.budget && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <RiBarChartLine className="w-3 h-3" />
                <span>Budget</span>
              </dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                {project.budget?.toString()} {project.currency}
              </dd>
            </div>
          )}
        </dl>
      )}

      {/* Resources Count (Grid view only) */}
      {!showResourceUsage && resourceCount > 0 && (
        <div className="mb-4 flex-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
            <RiServerLine className="w-3 h-3" />
            <span>
              <span className="font-medium">{resourceCount}</span> {resourceCount === 1 ? 'resource' : 'resources'}
            </span>
          </div>

          {resourceTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resourceTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata (for Organisation view) */}
      {showResourceUsage && (
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created {new Date(project.createdAt).toLocaleDateString('en-GB')}
          </div>
        </div>
      )}

      {/* Action Buttons (Grid view only) */}
      {!showResourceUsage && project.organisation && (
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/orga/${project.organisation.name}`} className="flex-1">
            <Button
              variant="secondary"
              className="w-full text-xs gap-1 px-3 py-2 h-auto"
            >
              View Details
              <RiArrowRightLine className="w-3 h-3" />
            </Button>
          </Link>
          <Link href={`/orga/${project.organisation.name}/add-resource`} className="flex-1">
            <Button
              className="w-full text-xs gap-1 px-3 py-2 h-auto"
            >
              <RiAddLine className="w-3 h-3" />
              Add Resource
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export function ProjectCard({ project, showResourceUsage = false, href }: ProjectCardProps) {
  if (href) {
    return (
      <Link href={href} className="block">
        <ProjectCardContent project={project} showResourceUsage={showResourceUsage} />
      </Link>
    );
  }

  return <ProjectCardContent project={project} showResourceUsage={showResourceUsage} />;
}

export type { ProjectWithTeamsAndResources };
