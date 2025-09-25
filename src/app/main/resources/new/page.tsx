import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { RiServerLine } from '@remixicon/react';
import CreateResourceForm from '@/components/form/CreateResourceForm';
import { teamService } from '@/lib/services/team';

export default async function CreateResourcePage() {
  const session = await auth();
  if (!session) return null;

  // Ensure user has a personal team, then get all their teams
  await teamService.ensurePersonalTeam(session.user.id);

  // Get teams where the user is owner or member
  const userTeams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    include: {
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Purchase New Resource
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Acquire and configure a new resource for your projects
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <CreateResourceForm
            currentUserId={session.user.id}
            teams={userTeams}
          />
        </Card>
      </div>
    </div>
  );
}