import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
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
  RiHomeLine
} from '@remixicon/react';

interface OrganisationOverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganisationOverviewPage({ params }: OrganisationOverviewPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: id
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
  const organisation = await prisma.organisation.findUnique({
    where: {
      id,
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
      _count: {
        select: {
          members: true,
          projects: true,
          teams: true,
        }
      }
    }
  });

  if (!organisation) {
    notFound();
  }

  return (
    <main className="mt-4">
      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/main" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
            <RiHomeLine className="h-4 w-4 mr-1" />
            Main
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href="/main/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
            Organisations
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">{organisation.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {organisation.name}
            </h1>
            {organisation.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {organisation.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <RiUserLine className="h-4 w-4" />
                {organisation._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <RiProjectorLine className="h-4 w-4" />
                {organisation._count.projects} projects
              </span>
              <span className="flex items-center gap-1">
                <RiTeamLine className="h-4 w-4" />
                {organisation._count.teams} teams
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/main/organisations/${id}/members`}>
              <Button variant="outline" size="sm">
                <RiUserLine className="mr-2 h-4 w-4" />
                Members
              </Button>
            </Link>
            {canManage && (
              <Link href={`/main/organisations/${id}/settings`}>
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
              <Button className="w-full">
                <RiUserAddLine className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </Card>
            <Card className="p-4">
              <Link href={`/main/teams/new?orga=${id}`} className="block">
                <Button variant="outline" className="w-full">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </Link>
            </Card>
            <Card className="p-4">
              <Link href={`/main/projects/new?org=${id}`} className="block">
                <Button variant="outline" className="w-full">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h2>
            <Link
              href={`/main/organisations/${id}/projects`}
              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium flex items-center gap-1"
            >
              View all projects <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          {organisation.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organisation.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/main/organisations/${id}/projects/${project.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <Badge
                        variant={project.status === 'ACTIVE' ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{project.progress}% complete</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <RiProjectorLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
              {canManage && (
                <Link href={`/main/projects/new?org=${id}`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

        {/* Teams Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Teams
            </h2>
            <Link
              href={`/main/organisations/${id}/teams`}
              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium flex items-center gap-1"
            >
              View all teams <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          {organisation.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organisation.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/main/organisations/${id}/teams/${team.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      {team.color && (
                        <div
                          className="w-4 h-4 rounded-full mr-3 border border-gray-300"
                          style={{ backgroundColor: team.color }}
                        />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {team.name}
                      </h3>
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <RiUserLine className="h-3 w-3 mr-1" />
                      <span>{team._count.members} members</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <RiTeamLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No teams yet</p>
              {canManage && (
                <Link href={`/main/teams/new?orga=${id}`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Team
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

        {/* Resources Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resources
            </h2>
            <Link
              href={`/main/organisations/${id}/resources`}
              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium flex items-center gap-1"
            >
              View all resources <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          <Card className="p-8 text-center">
            <RiServerLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Organisation resources coming soon</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              File storage, compute resources, and shared assets will be available here.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}