import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { RiProjectorLine } from '@remixicon/react';
import Link from 'next/link';
import ProjectForm from '@/components/form/ProjectForm';
import { teamService } from '@/lib/services/team';

export default async function CreateProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { team: preselectedTeamId } = await searchParams;

  // Ensure user has a personal team, then get all their teams
  await teamService.ensurePersonalTeam(session.user.id);

  // Get teams where the user is the owner (personal team + created teams)
  const userTeams = await prisma.team.findMany({
    where: {
      ownerId: session.user.id
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true
        }
      },
      organisation: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { isPersonal: 'desc' }, // Personal team first
      { name: 'asc' }
    ]
  });

  if (userTeams.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs />
        </div>

        <Card className="p-8 text-center">
          <RiProjectorLine className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Teams Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You need at least one team to create projects. Your personal team should have been created automatically.
          </p>
          <Link href="/main/teams">
            <Button>
              View Teams
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Create a project and assign it to one of your teams
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Card>
          <ProjectForm
            teams={userTeams}
            redirectUrl="/main/projects"
            currentUserId={session.user.id}
            preselectedTeamId={preselectedTeamId}
          />
        </Card>
      </div>
    </div>
  );
}