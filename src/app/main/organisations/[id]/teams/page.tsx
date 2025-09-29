import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Link from 'next/link';
import {
  RiTeamLine,
  RiUserLine,
  RiAddLine,
  RiArrowRightLine,
  RiHomeLine,
  RiSettings3Line
} from '@remixicon/react';

interface OrganisationTeamsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganisationTeamsPage({ params }: OrganisationTeamsPageProps) {
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

  // Fetch the organisation with teams
  const organisation = await prisma.organisation.findUnique({
    where: {
      id,
      isActive: true
    },
    include: {
      teams: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
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
          <Link href={`/main/organisations/${id}`} className="hover:text-gray-900 dark:hover:text-gray-100">
            {organisation.name}
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">Teams</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Teams
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage teams for {organisation.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <Link href={`/main/teams/new?orga=${id}`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Teams Grid */}
        {organisation.teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organisation.teams.map((team) => (
              <Link
                key={team.id}
                href={`/main/organisations/${id}/teams/${team.id}`}
                className="block"
              >
                <Card className="p-6 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center mb-4">
                    {team.color && (
                      <div
                        className="w-5 h-5 rounded-full mr-3 border border-gray-300"
                        style={{ backgroundColor: team.color }}
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {team.name}
                    </h3>
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {team.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <RiUserLine className="h-4 w-4 mr-2" />
                      <span>{team._count.members} members</span>
                    </div>
                    <div>
                      <span className="text-xs">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {team.owner && (
                      <div className="text-xs">
                        <span className="font-medium">Owner:</span> {team.owner.name || team.owner.email}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {team._count.members === 1 ? '1 member' : `${team._count.members} members`}
                    </Badge>
                    <RiArrowRightLine className="h-4 w-4 text-gray-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <RiTeamLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first team for this organisation.
            </p>
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
      </Container>
    </main>
  );
}