import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Link from 'next/link';
import {
  RiProjectorLine,
  RiAddLine,
  RiArrowRightLine,
  RiHomeLine,
  RiTeamLine,
  RiCalendarLine,
  RiProgress3Line
} from '@remixicon/react';

interface OrganisationProjectsPageProps {
  params: Promise<{ name: string }>;
}

export default async function OrganisationProjectsPage({ params }: OrganisationProjectsPageProps) {
  const { name } = await params;

  // Validate that name is provided
  if (!name) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    notFound();
  }

  const organisation = await prisma.organisation.findUnique({
    where: { name },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          progress: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedTeams: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }
    }
  });
  if (!organisation) notFound();

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: organisation.id
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

  return (
    <main className="mt-4">
      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
            <RiHomeLine className="h-4 w-4 mr-1" />
            Main
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href="/orga" className="hover:text-gray-900 dark:hover:text-gray-100">
            Organisations
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href={`/orga/${name}`} className="hover:text-gray-900 dark:hover:text-gray-100">
            {organisation.name}
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">Projects</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage all projects for {organisation.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <Link href={`/orga/${name}/projects/new`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {organisation.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organisation.projects.map((project) => (
              <Link
                key={project.id}
                href={`/orga/${name}/${project.name}`}
                className="block"
              >
                <Card className="p-6 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                      {project.name}
                    </h3>
                    <Badge
                      variant={project.status === 'ACTIVE' ? 'success' : project.status === 'COMPLETED' ? 'default' : 'warning'}
                      className="text-xs flex-shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center">
                        <RiProgress3Line className="h-4 w-4 mr-1" />
                        Progress
                      </span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <RiTeamLine className="h-4 w-4 mr-2" />
                      <span>{project._count.assignedTeams} teams assigned</span>
                    </div>
                    <div className="flex items-center">
                      <RiCalendarLine className="h-4 w-4 mr-2" />
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <RiArrowRightLine className="h-4 w-4 text-gray-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <RiProjectorLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first project for this organisation.
            </p>
            {canManage && (
              <Link href={`/orga/${name}/projects/new`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Project Stats */}
        {organisation.projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-2">
                {organisation.projects.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {organisation.projects.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {organisation.projects.filter(p => p.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {Math.round(
                  organisation.projects.reduce((acc, p) => acc + p.progress, 0) /
                  organisation.projects.length
                ) || 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Progress</div>
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}