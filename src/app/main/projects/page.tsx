import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProjectsList from '@/components/ProjectsList';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  // Fetch user's projects through team memberships and organisation memberships
  const [userProjects, userTeams] = await Promise.all([
    prisma.project.findMany({
      where: {
        team: {
          OR: [
            {
              // User is a member of the team
              members: {
                some: {
                  userId: session.user.id
                }
              }
            },
          ]
        }
      },
      include: {
        team: {
          include: {
            owner: true,
            organisation: true,
            _count: {
              select: {
                members: true,
                projects: true
              }
            }
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    }),
    // Fetch user's teams for the selector
    prisma.team.findMany({
      where: {
        OR: [
          {
            // User is a member of the team
            members: {
              some: {
                userId: session.user.id
              }
            }
          },
        ]
      },
      include: {
        owner: true,
        organisation: true,
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: [
        { isPersonal: 'desc' }, // Personal teams first
        { name: 'asc' }
      ]
    })
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your projects and filter by team
            </p>
          </div>
        </div>
      </div>

      {/* Projects List with Team Filter */}
      <ProjectsList
        initialProjects={userProjects}
        teams={userTeams}
      />
    </div>
  );
}