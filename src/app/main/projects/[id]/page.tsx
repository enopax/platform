import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import ProjectForm from '@/components/form/ProjectForm';
import {
  RiArrowLeftLine,
  RiProjectorLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine
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

  // Get project with full details
  const [projectRaw, userOrganisations] = await Promise.all([
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
    // Get organisations where the user is a member (they can edit projects in their orgs)
    prisma.organisation.findMany({
      where: {
        OR: [
          // Organisations they own
          { ownerId: session.user.id },
          // Organisations they're a member of
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!projectRaw) {
    notFound();
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Project
              </h2>
            </div>
            <div className="p-6">
              <ProjectForm 
                project={project}
                organisations={userOrganisations}
                successMessage="Project updated successfully!"
              />
            </div>
          </Card>
        </div>

        {/* Project Overview */}
        <div className="lg:col-span-1">
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

          <div className="mt-6">
            <MemberList 
              members={project.team.members || []}
              title="Members"
              compact={true}
              maxHeight="max-h-80"
              showJoinDate={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}