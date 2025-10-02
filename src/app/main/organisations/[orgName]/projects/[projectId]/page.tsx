import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Breadcrumbs, { ProjectBreadcrumbs } from '@/components/common/Breadcrumbs';
import Table from '@/components/GenericTable';
import ResourcesHealthDashboard from '@/components/dashboard/ResourcesHealthDashboard';
import ProjectResources from '@/components/project/ProjectResources';
import { columns as resourceColumns } from '@/components/table/Resource';
import {
  RiArrowLeftLine,
  RiProjectorLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine,
  RiAddLine,
  RiServerLine,
  RiDatabase2Line,
  RiSettings3Line
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MemberList from '@/components/user/MemberList';

interface ProjectDetailsPageProps {
  params: Promise<{ orgName: string; projectId: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const session = await auth();
  if (!session) return null;

  const { orgName, projectId } = await params;

  // Function to get resource metrics for this project
  async function getProjectResourceMetrics(projectId: string) {
    try {
      const storageResources = await prisma.resource.findMany({
        where: {
          allocatedProjects: {
            some: {
              projectId
            }
          },
          type: 'STORAGE',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          quotaLimit: true,
          currentUsage: true,
          configuration: true,
        }
      });

      return { storageResources };
    } catch (error) {
      console.error('Error fetching project resource metrics:', error);
      return { storageResources: [] };
    }
  }

  // Get project with full details including teams and resources
  const [projectRaw, projectResources, resourceMetrics] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTeams: {
          include: {
            team: {
              include: {
                owner: true,
                members: {
                  include: {
                    user: true
                  }
                },
                _count: {
                  select: {
                    members: true,
                    assignedProjects: true
                  }
                }
              }
            }
          }
        },
      },
    }),
    // Get resource allocations for this project
    prisma.projectResource.findMany({
      where: {
        projectId
      },
      include: {
        resource: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                firstname: true,
                lastname: true,
                email: true,
              }
            },
            organisation: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        allocatedAt: 'desc'
      }
    }),
    // Get resource metrics
    getProjectResourceMetrics(projectId)
  ]);

  if (!projectRaw) {
    notFound();
  }

  // Enhance resources with metrics for health dashboard
  const resourcesWithMetrics = projectResources.map(allocation => {
    const resource = allocation.resource;
    if (resource.type === 'STORAGE') {
      const storageResource = resourceMetrics.storageResources.find(sr => sr.id === resource.id);
      if (storageResource) {
        const totalSize = Number(storageResource.quotaLimit || 0);
        const usedSize = Number(storageResource.currentUsage || 0);
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
    }
    return {
      ...resource,
      storageMetrics: null,
    };
  });

  // Check if user has access to this project (member of organisation)
  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: projectRaw!.organisationId
      }
    }
  });

  if (!membership) {
    notFound();
  }

  // Check if user can manage resources (owner or manager)
  const orgMembership = isAdmin ? { role: 'OWNER' as const } : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: projectRaw!.organisationId
      }
    },
    select: {
      role: true
    }
  });

  const canManage = isAdmin || orgMembership?.role === 'OWNER' || orgMembership?.role === 'MANAGER';

  // Convert Decimal to string for client components
  const project = {
    ...projectRaw,
    budget: projectRaw.budget?.toString() || null,
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'PLANNING': return 'outline';
      case 'ON_HOLD': return 'outline';
      case 'CANCELLED': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'default';
      case 'HIGH': return 'secondary';
      case 'MEDIUM': return 'outline';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  // Transform resources for health dashboard
  const healthDashboardResources = resourcesWithMetrics.map(resource => ({
    id: resource.id,
    name: resource.name,
    type: resource.type as 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'NETWORK',
    status: 'HEALTHY' as const, // You can implement real health checking logic here
    projectId: project.id,
    projectName: project.name,
    usage: resource.storageMetrics ? {
      current: resource.storageMetrics.usedSize,
      total: resource.storageMetrics.totalSize,
      percentage: resource.storageMetrics.totalSize > 0
        ? Math.round((resource.storageMetrics.usedSize / resource.storageMetrics.totalSize) * 100)
        : 0
    } : undefined,
    lastChecked: new Date(resource.updatedAt),
    responseTime: Math.floor(Math.random() * 100) + 20 // Mock response time
  }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <ProjectBreadcrumbs
          projectName={project.name}
          projectId={project.id}
        />
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
                <RiProjectorLine className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {project.organisation.name}
                </p>
              </div>
            </div>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-3xl">
                {project.description}
              </p>
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
              <Link href={`/main/organisations/${orgName}/projects/${project.id}/settings`}>
                <Button variant="outline" size="sm">
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href={`/main/organisations/${orgName}/resources/new?project=${project.id}`}>
                <Button size="sm">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {project.progress}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RiBarChartLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resources</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {resourcesWithMetrics.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <RiServerLine className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Active resources
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teams</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {project.assignedTeams.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <RiTeamLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {project.assignedTeams.length === 0 ? 'No teams assigned' : 'Assigned teams'}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Timeline</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'Not set'
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <RiCalendarLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {project.endDate ? 'Target end date' : 'No deadline'}
            </p>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Resources Section */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Resources
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Allocated resources for this project
                </p>
              </div>
              {canManage && (
                <Link href={`/main/organisations/${orgName}/resources/new?project=${project.id}`}>
                  <Button size="sm">
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Allocate Resource
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            <ProjectResources
              resources={projectResources}
              projectId={project.id}
              orgName={orgName}
              canManage={canManage}
            />
          </div>
        </Card>

        {/* Teams Section */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Teams ({project.assignedTeams.length})
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Teams working on this project
                </p>
              </div>
              <Link href={`/main/organisations/${orgName}/projects/${project.id}/settings`}>
                <Button variant="outline" size="sm">
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Manage Teams
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            {project.assignedTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.assignedTeams.map(({ team }) => (
                  <Link
                    key={team.id}
                    href={`/main/organisations/${orgName}/teams/${team.id}`}
                  >
                    <Card className="p-5 hover:shadow-md transition-all hover:border-brand-300 dark:hover:border-brand-700">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                          <RiTeamLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Led by {team.owner.name || team.owner.email}
                          </p>

                          {/* Team Members Avatars */}
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {team.members.slice(0, 5).map((member, idx) => (
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
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <RiTeamLine className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No teams assigned
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Assign teams to collaborate on this project
                </p>
                <Link href={`/main/organisations/${orgName}/projects/${project.id}/settings`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Assign Teams
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Project Details */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Project Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Timeline</h3>
                {project.startDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                      <RiCalendarLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                        {new Date(project.startDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {project.endDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-0.5">
                      <RiCalendarLine className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target End</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                        {new Date(project.endDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {!project.startDate && !project.endDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No timeline set</p>
                )}
              </div>

              {/* Budget & Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Budget & Links</h3>
                {project.budget && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-0.5">
                      <RiDatabase2Line className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-semibold">
                        {project.budget} {project.currency}
                      </p>
                    </div>
                  </div>
                )}

                {project.repositoryUrl && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mt-0.5">
                      <RiDatabase2Line className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Repository</label>
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-0.5 block truncate"
                      >
                        {project.repositoryUrl}
                      </a>
                    </div>
                  </div>
                )}

                {!project.budget && !project.repositoryUrl && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No budget or links set</p>
                )}
              </div>

              {/* Documentation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Documentation</h3>
                {project.documentationUrl && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mt-0.5">
                      <RiDatabase2Line className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Docs URL</label>
                      <a
                        href={project.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-0.5 block truncate"
                      >
                        {project.documentationUrl}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-0.5">
                    <RiDatabase2Line className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organisation</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {project.organisation.name}
                    </p>
                  </div>
                </div>

                {!project.documentationUrl && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No documentation links</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}