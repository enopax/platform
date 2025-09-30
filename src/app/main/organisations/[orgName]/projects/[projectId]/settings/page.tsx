import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProjectBreadcrumbs } from '@/components/common/Breadcrumbs';
import ProjectForm from '@/components/form/ProjectForm';
import {
  RiSettingsLine,
  RiProjectorLine
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProjectSettingsPageProps {
  params: Promise<{ orgName: string; projectId: string }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth();
  if (!session) return null;

  const { orgName, projectId } = await params;

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: { id: true, name: true }
  });
  if (!organisation) notFound();

  // Get project with access verification and user teams
  const [projectRaw, userTeams] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          }
        },
        assignedTeams: {
          include: {
            team: {
              include: {
                owner: true,
                organisation: true,
                members: {
                  include: {
                    user: true
                  }
                }
              },
            },
          },
        },
      },
    }),
    // Get teams where the user is a member (they can edit projects in their teams)
    prisma.team.findMany({
      where: {
        OR: [
          // Teams they own
          { ownerId: session.user.id },
          // Teams they're a member of
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        owner: true,
        organisation: true,
      },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!projectRaw) {
    notFound();
  }

  // Check if user has access to this project (admin or member of organisation)
  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: projectRaw.organisationId
      }
    }
  });

  if (!membership) {
    notFound();
  }

  // Convert Decimal to string and add teamId for form
  const project = {
    ...projectRaw,
    budget: projectRaw.budget?.toString() || null,
    teamId: projectRaw.assignedTeams[0]?.team.id || null,
    team: projectRaw.assignedTeams[0]?.team || null,
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
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <ProjectBreadcrumbs
          projectName={project.name}
          projectId={project.id}
          currentPage="Settings"
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
            <RiSettingsLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Settings
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage settings and configuration for {project.name}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Project Settings Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                  <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Project Configuration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update project information and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ProjectForm
                project={project}
                teams={userTeams}
                successMessage="Project updated successfully!"
                currentUserId={session.user.id}
                redirectUrl={`/main/organisations/${orgName}/projects/${project.id}`}
              />
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

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Teams:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.assignedTeams.length > 0
                    ? project.assignedTeams.map(at => at.team.name).join(', ')
                    : 'Unassigned'
                  }
                </span>
              </div>

              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.organisation.name}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Progress:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.progress}%
                </span>
              </div>

              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(project.updatedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {project.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href={`/main/organisations/${orgName}/projects/${project.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiProjectorLine className="mr-2 h-4 w-4" />
                  View Project Details
                </Button>
              </Link>
              <Link href={`/main/organisations/${orgName}/projects/${project.id}/add-resource`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiProjectorLine className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}