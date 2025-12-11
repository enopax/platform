'use client';

import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Divider } from '@/components/common/Divider';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProjectResources from '@/components/project/ProjectResources';
import { useProject } from '@/contexts/ProjectContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import {
  RiProjectorLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine,
  RiAddLine,
  RiSettings3Line,
  RiServerLine
} from '@remixicon/react';
import Link from 'next/link';

export default function ProjectDetailsClient() {
  const project = useProject();
  const organisation = useOrganisation();
  const orgName = organisation.name;

  // Enhance resources with metrics for health dashboard
  const resourcesWithMetrics = (project.allocatedResources || []).map(allocation => {
    const resource = allocation.resource;
    if (resource.type === 'STORAGE') {
      const totalSize = Number(resource.quotaLimit || 0);
      const usedSize = Number(resource.currentUsage);
      const availableSize = Math.max(0, totalSize - usedSize);

      return {
        ...resource,
        storageMetrics: {
          totalSize,
          usedSize,
          availableSize,
        },
      };
    }
    return {
      ...resource,
      storageMetrics: null,
    };
  });

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

  // Transform resources for health dashboard
  const healthDashboardResources = resourcesWithMetrics.map(resource => ({
    id: resource.id,
    name: resource.name,
    type: resource.type as 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'NETWORK',
    status: 'HEALTHY' as const,
    projectId: project.id,
    projectName: project.name,
    usage: resource.storageMetrics
      ? {
          current: resource.storageMetrics.usedSize,
          total: resource.storageMetrics.totalSize,
          percentage:
            resource.storageMetrics.totalSize > 0
              ? Math.round((resource.storageMetrics.usedSize / resource.storageMetrics.totalSize) * 100)
              : 0,
        }
      : undefined,
    lastChecked: new Date(resource.updatedAt),
    responseTime: Math.floor(Math.random() * 100) + 20,
  }));

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
                <RiProjectorLine className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.organisation?.name}</p>
              </div>
            </div>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-3xl">{project.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                {project.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(project.priority)} className="text-xs">
                {project.priority}
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Link href={`/orga/${orgName}/${project.name}/settings`}>
                <Button variant="outline" size="sm">
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href={`/orga/${orgName}/resources/new?project=${project.id}`}>
                <Button size="sm">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Overview - Definition List */}
        <dl className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <RiBarChartLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Progress
            </dt>
            <dd className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{project.progress}%</dd>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <RiServerLine className="w-4 h-4 text-green-600 dark:text-green-400" />
              Resources
            </dt>
            <dd className="text-3xl font-bold text-gray-900 dark:text-white">
              {resourcesWithMetrics.length}
            </dd>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active resources</p>
          </div>

          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <RiTeamLine className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Teams
            </dt>
            <dd className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.assignedTeams?.length || 0}
            </dd>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(project.assignedTeams?.length || 0) === 0 ? 'No teams assigned' : 'Assigned teams'}
            </p>
          </div>

          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <RiCalendarLine className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Timeline
            </dt>
            <dd className="text-lg font-bold text-gray-900 dark:text-white">
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Not set'}
            </dd>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {project.endDate ? 'Target end date' : 'No deadline'}
            </p>
          </div>
        </dl>
      </div>

      {/* Divider */}
      <Divider className="my-16" />

      {/* Main Content */}
      <div className="space-y-16">
        {/* Resources Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resources</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allocated resources for this project</p>
            </div>
          </div>
          <ProjectResources
            resources={project.allocatedResources || []}
            projectId={project.id}
            orgName={orgName}
            projectName={project.name}
            canManage={false}
          />
        </section>

        {/* Teams Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Teams ({project.assignedTeams?.length || 0})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Teams working on this project</p>
            </div>
            <Link href={`/orga/${orgName}/${project.name}/settings`}>
              <Button variant="outline" size="sm">
                <RiSettings3Line className="mr-2 h-4 w-4" />
                Manage Teams
              </Button>
            </Link>
          </div>
          {(project.assignedTeams?.length || 0) > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.assignedTeams?.map(({ team }) => (
                <Link key={team.id} href={`/orga/${orgName}/teams/${team.id}`} className="group">
                  <div className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:border-brand-300 dark:hover:border-brand-700">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                        <RiTeamLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Led by {team.owner.name || team.owner.email}
                        </p>

                        {/* Team Members Avatars */}
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {team.members?.slice(0, 5).map(member => (
                              <div
                                key={member.user.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                                title={member.user.name || member.user.email}
                              >
                                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {team._count.members > 5 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 text-gray-600 dark:text-gray-400">
                                +{team._count.members - 5}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {team._count.members} {team._count.members === 1 ? 'member' : 'members'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <RiTeamLine className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No teams assigned</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Assign teams to collaborate on this project
              </p>
              <Link href={`/orga/${orgName}/${project.name}/settings`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Assign Teams
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Project Information Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-8">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Timeline */}
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Timeline
                </dt>
              </div>
              {project.startDate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5 shrink-0">
                    <RiCalendarLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</dt>
                    <dd className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {new Date(project.startDate).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </div>
              )}

              {project.endDate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-0.5 shrink-0">
                    <RiCalendarLine className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target End</dt>
                    <dd className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {new Date(project.endDate).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </div>
              )}

              {!project.startDate && !project.endDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No timeline set</p>
              )}
            </dl>

            {/* Budget & Links */}
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Budget & Links
                </dt>
              </div>
              {project.budget && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-0.5 shrink-0">
                    <RiCalendarLine className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget</dt>
                    <dd className="text-sm text-gray-900 dark:text-white mt-0.5 font-semibold">
                      {project.budget} {project.currency}
                    </dd>
                  </div>
                </div>
              )}

              {project.repositoryUrl && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mt-0.5 shrink-0">
                    <RiCalendarLine className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Repository</dt>
                    <dd>
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-0.5 block truncate"
                      >
                        {project.repositoryUrl}
                      </a>
                    </dd>
                  </div>
                </div>
              )}

              {!project.budget && !project.repositoryUrl && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No budget or links set</p>
              )}
            </dl>

            {/* Documentation */}
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Documentation
                </dt>
              </div>
              {project.documentationUrl && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mt-0.5 shrink-0">
                    <RiCalendarLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Docs URL</dt>
                    <dd>
                      <a
                        href={project.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-0.5 block truncate"
                      >
                        {project.documentationUrl}
                      </a>
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-0.5 shrink-0">
                  <RiCalendarLine className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organisation</dt>
                  <dd className="text-sm text-gray-900 dark:text-white mt-0.5">{project.organisation?.name}</dd>
                </div>
              </div>

              {!project.documentationUrl && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No documentation links</p>
              )}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
