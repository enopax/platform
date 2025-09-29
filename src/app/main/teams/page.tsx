import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Table from '@/components/GenericTable';
import { columns as teamColumns } from '@/components/table/MainTeam';
import {
  RiProjectorLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine
} from '@remixicon/react';
import Link from 'next/link';

export default async function TeamsPage({
    searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);
  const session = await auth();
  if (!session) return null;

  const userTeams = await prisma.team.findMany({
    where: {
      OR: [
        // Teams where user is a member
        {
          members: {
            some: {
              userId: session.user.id
            }
          }
        },
        // Teams where user is the owner
        {
          ownerId: session.user.id
        }
      ]
    },
    include: {
      organisation: true,
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true,
          email: true,
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstname: true,
              lastname: true,
              email: true,
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      },
      _count: {
        select: {
          members: true,
          assignedProjects: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNumber - 1) * size,
    take: size,
  });

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
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs />
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Teams
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your teams and discover new ones to join
            </p>
          </div>
          <Link href="/main/teams/new">
            <Button className="w-full sm:w-auto">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Teams Table Section */}
      {userTeams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            My Teams ({userTeams.length})
          </h2>
          <Card className="overflow-hidden">
            <Table
              pageNumber={1}
              tableSize={userTeams.length}
              tableData={userTeams}
              tableColumns={teamColumns}
            />
          </Card>
        </div>
      )}

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/main/teams/new" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiTeamLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create New Team</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new team for your organisation
              </p>
            </div>
          </Link>

          <Link href="/main/projects" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiProjectorLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">View Projects</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See all projects from your teams
              </p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}