import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import TeamForm from '@/components/form/TeamForm';
import DeleteTeamButton from '@/components/form/DeleteTeamButton';
import {
  RiArrowLeftLine,
  RiTeamLine,
  RiSettingsLine,
  RiBuildingLine,
  RiUserLine,
  RiCalendarLine
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface TeamSettingsPageProps {
  params: Promise<{ orgName: string; teamId: string }>;
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const session = await auth();

  const { orgName, teamId } = await params;

  // Validate that orgName is provided
  if (!orgName) {
    notFound();
  }

  // Get team with access verification and available organisations
  const [team, userOrganisations] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
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
              }
            }
          }
        },
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
          }
        },
        _count: {
          select: {
            members: true,
            assignedProjects: true
          }
        }
      },
    }),
    // Get organisations where the user is the owner (they can create teams)
    prisma.organisation.findMany({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  if (!team) {
    notFound();
  }

  // Check if current user can manage this team
  const isOwner = team.ownerId === session.user.id;
  const userMembership = team.members.find(m => m.userId === session.user.id);
  const canManage = isOwner || userMembership?.role === 'LEAD';

  if (!canManage) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/orga/${orgName}/teams/${team.id}`}>
            <Button variant="outline" size="sm">
              <RiArrowLeftLine className="mr-2 h-4 w-4" />
              Back to Team
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <RiSettingsLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Manage settings and configuration for {team.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {team.isPersonal && (
              <Badge variant="outline">
                Personal Team
              </Badge>
            )}
            {team.color && (
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: team.color }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Team Settings Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                  <RiTeamLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Configuration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update team information and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {team.isPersonal ? (
                <div className="text-center py-8">
                  <RiTeamLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Personal Team Settings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Personal teams have limited configuration options. Most settings are managed automatically.
                  </p>
                </div>
              ) : (
                <TeamForm
                  team={{
                    ...team,
                    owner: team.owner,
                    organisation: team.organisation!
                  }}
                  organisations={userOrganisations}
                  successMessage="Team updated successfully!"
                  redirectUrl={`/orga/${orgName}/teams/${team.id}`}
                />
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          {isOwner && !team.isPersonal && (
            <Card className="mt-6">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                    <RiSettingsLine className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Danger Zone
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Irreversible and destructive actions
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                    Delete Team
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Once you delete a team, there is no going back. This will permanently delete the team and all associated projects and resources.
                  </p>
                  <DeleteTeamButton
                    teamId={team.id}
                    teamName={team.name}
                    organisationId={team.organisation?.id}
                    variant="destructive"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Team Overview */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiTeamLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Team Overview
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Owner:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {team.owner.name || team.owner.firstname || team.owner.email}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {team.organisation?.name || 'Personal Team'}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Members:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {team._count.members + 1} {/* +1 for owner */}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Projects:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {team._count.assignedProjects}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(team.createdAt).toLocaleDateString()}
                </span>
              </div>

              {team.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {team.description}
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
              <Link href={`/orga/${orgName}/teams/${team.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiTeamLine className="mr-2 h-4 w-4" />
                  View Team Members
                </Button>
              </Link>
              <Link href="/main/teams" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiTeamLine className="mr-2 h-4 w-4" />
                  All Teams
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}