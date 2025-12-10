import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SimpleOrganisationBreadcrumbs } from '@/components/common/Breadcrumbs';
import Link from 'next/link';
import {
  RiUserAddLine,
  RiSettings3Line,
  RiProjectorLine,
  RiTeamLine,
  RiServerLine,
  RiAddLine,
  RiArrowRightLine,
  RiBuildingLine,
  RiUserLine,
  RiHomeLine,
  RiHardDriveLine,
  RiDatabaseLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine
} from '@remixicon/react';

interface OrganisationOverviewPageProps {
  params: Promise<{ name: string }>;
}

export default async function OrganisationOverviewPage({ params }: OrganisationOverviewPageProps) {
  const { name } = await params;
  const session = await auth();

  // Validate that name is provided
  if (!name) {
    notFound();
  }

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: name },
    select: { id: true, name: true }
  });
  if (!organisation) notFound();
  const organisationId = organisation.id;

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;

  // Anyone can view the page, but need to be a member or admin to see details
  if (!isMember && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access management actions
  const canManage = isOwner || isManager || isAdmin;

  // Fetch the organisation with projects, teams, and resources
  const organisationFull = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
      isActive: true
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
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          progress: true,
          createdAt: true,
          allocatedResources: {
            include: {
              resource: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  currentUsage: true,
                  quotaLimit: true,
                }
              }
            },
            where: {
              resource: {
                isActive: true,
                status: 'ACTIVE'
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 6
      },
      teams: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 6
      },
      resources: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
        where: {
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      },
      _count: {
        select: {
          members: true,
          projects: true,
          teams: true,
          resources: true
        }
      }
    }
  });

  if (!organisationFull) {
    notFound();
  }

  return (
    <main className="mt-4">
      <Container>
        {/* Breadcrumbs */}
        <div className="mb-6">
          <SimpleOrganisationBreadcrumbs organisationName={organisationFull.name} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {organisationFull.name}
            </h1>
            {organisationFull.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {organisationFull.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <RiUserLine className="h-4 w-4" />
                {organisationFull._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <RiProjectorLine className="h-4 w-4" />
                {organisationFull._count.projects} projects
              </span>
              <span className="flex items-center gap-1">
                <RiTeamLine className="h-4 w-4" />
                {organisationFull._count.teams} teams
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/orga/${name}/members`}>
              <Button variant="outline" size="sm">
                <RiUserLine className="mr-2 h-4 w-4" />
                Members
              </Button>
            </Link>
            {canManage && (
              <Link href={`/orga/${name}/settings`}>
                <Button variant="outline" size="sm">
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {canManage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <Link href={`/orga/${name}/members`} className="block">
                <Button variant="outline" className="w-full">
                  <RiUserAddLine className="mr-2 h-4 w-4" />
                  Manage Members
                </Button>
              </Link>
            </Card>
            <Card className="p-4">
              <Link href={`/orga/${name}/teams`} className="block">
                <Button variant="outline" className="w-full">
                  <RiTeamLine className="mr-2 h-4 w-4" />
                  View Teams
                </Button>
              </Link>
            </Card>
            <Card className="p-4">
              <Link href={`/orga/${name}/resources`} className="block">
                <Button variant="outline" className="w-full">
                  <RiServerLine className="mr-2 h-4 w-4" />
                  View Resources
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h2>
            {canManage && (
              <Link href={`/orga/${name}/new-project`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
          </div>

          {organisationFull.projects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organisationFull.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/orga/${name}/${project.name}`}
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
                          {(() => {
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

                            return Object.entries(typeMap).map(([type, count]) => {
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
                            });
                          })()}
                        </div>

                        {/* Resource Usage */}
                        {(() => {
                          const totalUsage = project.allocatedResources.reduce((sum, allocation) => {
                            return sum + Number(allocation.resource.currentUsage || 0);
                          }, 0);

                          const totalQuota = project.allocatedResources.reduce((sum, allocation) => {
                            return sum + Number(allocation.resource.quotaLimit || 0);
                          }, 0);

                          const usagePercentage = totalQuota > 0 ? Math.round((totalUsage / totalQuota) * 100) : 0;

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

                          return (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Resource usage</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {formatBytes(totalUsage)} / {formatBytes(totalQuota)} ({usagePercentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                                  style={{ width: `${usagePercentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
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
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <RiProjectorLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">No projects yet</p>
              {canManage && (
                <Link href={`/orga/${name}/new-project`}>
                  <Button size="lg">
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

      </Container>
    </main>
  );
}