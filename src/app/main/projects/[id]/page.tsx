import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Table from '@/components/GenericTable';
import { columns as resourceColumns } from '@/components/table/Resource';
import {
  RiArrowLeftLine,
  RiProjectorLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine,
  RiAddLine,
  RiServerLine,
  RiDatabase2Line
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MemberList from '@/components/MemberList';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  // Function to get resource metrics for this project
  async function getProjectResourceMetrics(projectId: string) {
    try {
      const storageResources = await prisma.resource.findMany({
        where: {
          projectId,
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

  // Get project with full details including resources
  const [projectRaw, projectResources, resourceMetrics] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            owner: true,
            organisation: {
              include: {
                members: true
              }
            },
            members: {
              include: {
                user: true
              }
            },
            _count: {
              select: {
                members: true,
                projects: true
              }
            }
          },
        },
      },
    }),
    // Get resources for this project
    prisma.resource.findMany({
      where: {
        projectId: id,
        isActive: true,
      },
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
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
                organisationId: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Get resource metrics
    getProjectResourceMetrics(id)
  ]);

  if (!projectRaw) {
    notFound();
  }

  // Enhance resources with metrics
  const resourcesWithMetrics = projectResources.map(resource => {
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

  // Check if user has access to this project (member of the team or organisation)
  const hasAccess = projectRaw.team.members.some(
    member => member.userId === session.user.id
  ) || (
    projectRaw.team.organisation &&
    (projectRaw.team.organisation.members?.some(
      member => member.userId === session.user.id
    ) || projectRaw.team.organisation.ownerId === session.user.id)
  );

  if (!hasAccess) {
    notFound();
  }

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {project.team.organisation?.name || 'Personal Team'} • Team: {project.team.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(project.priority)}>
              {project.priority}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Project Resources */}
        <div className="xl:col-span-3 space-y-6">
          {/* Resources Section */}
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <RiServerLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Project Resources
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Manage computing resources for this project
                  </p>
                </div>
              </div>
              <Link href={`/main/projects/${project.id}/add-resource`}>
                <Button size="sm">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </Link>
            </div>

            {resourcesWithMetrics.length > 0 ? (
              <Table
                pageNumber={1}
                tableSize={resourcesWithMetrics.length}
                tableData={resourcesWithMetrics}
                tableColumns={resourceColumns}
                tableMeta={{ currentUserId: session.user.id }}
              />
            ) : (
              <div className="p-8 text-center">
                <RiServerLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No resources yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by creating your first resource for this project.
                </p>
                <Link href={`/main/projects/${project.id}/add-resource`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Resource
                  </Button>
                </Link>
              </div>
            )}
          </Card>


          {/* Project Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Management
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Link href={`/main/projects/${project.id}/settings`} className="group">
                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
                  <RiProjectorLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Project Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure project details, status, and team assignment
                  </p>
                </div>
              </Link>

              <Link href={`/main/projects/${project.id}/add-resource`} className="group">
                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
                  <RiAddLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Add Resource</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create new storage or computing resources for this project
                  </p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Sidebar - Project Overview */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Overview
              </h2>
            </div>

            {project.description && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              </div>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-brand-600 dark:bg-brand-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <RiServerLine className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{resourcesWithMetrics.length}</span> resources
                </span>
              </div>

              <div className="flex items-center text-sm">
                <RiTeamLine className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{project.team._count.members}</span> team members
                </span>
              </div>

              {project.startDate && (
                <div className="flex items-center text-sm">
                  <RiCalendarLine className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Started {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {project.endDate && (
                <div className="flex items-center text-sm">
                  <RiCalendarLine className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Target end {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {project.budget && (
                <div className="flex items-center text-sm">
                  <RiBarChartLine className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Budget: <span className="font-medium">{project.budget}</span> {project.currency}
                  </span>
                </div>
              )}

              {project.repositoryUrl && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View Repository →
                  </a>
                </div>
              )}

              {project.documentationUrl && (
                <div>
                  <a
                    href={project.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View Documentation →
                  </a>
                </div>
              )}
            </div>
          </Card>

          <MemberList
            members={project.team.members || []}
            title="Team Members"
            compact={true}
            maxHeight="max-h-80"
            showJoinDate={false}
          />
        </div>
      </div>
    </div>
  );
}