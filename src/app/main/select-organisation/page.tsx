import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  RiBuildingLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine,
  RiProjectorLine,
  RiArrowRightLine
} from '@remixicon/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function SelectOrganisationPage() {
  const session = await auth();
  if (!session) return redirect('/');

  const isAdmin = session.user.role === 'ADMIN';

  // Fetch user's organisation memberships
  const organisationMemberships = isAdmin
    ? await prisma.organisation.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
              projects: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).then(orgs => orgs.map(org => ({
        organisation: org,
        role: 'ADMIN' as const,
        joinedAt: org.createdAt
      })))
    : await prisma.organisationMember.findMany({
        where: {
          userId: session.user.id,
          organisation: {
            isActive: true
          }
        },
        include: {
          organisation: {
            include: {
              _count: {
                select: {
                  members: true,
                  teams: true,
                  projects: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'ADMIN': return 'secondary';
      case 'MANAGER': return 'secondary';
      case 'MEMBER': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RiBuildingLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Select Organisation
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
            Choose an organisation to continue to your dashboard. You'll be able to manage projects, teams, and resources within the selected organisation.
          </p>
        </div>

        {organisationMemberships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {organisationMemberships.map(({ organisation, role, joinedAt }) => (
              <Card key={organisation.id} className="p-6 hover:shadow-lg transition-all group cursor-pointer">
                <Link href={`/main?org=${organisation.id}`} className="block">
                  {/* Organisation Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl mr-4 flex-shrink-0 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                        <RiBuildingLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors">
                          {organisation.name}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(role)} className="mt-1">
                          {role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {organisation.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {organisation.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiProjectorLine className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {organisation._count.projects}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Projects
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiTeamLine className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {organisation._count.teams}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Teams
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiUserLine className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {organisation._count.members}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Members
                      </div>
                    </div>
                  </div>

                  {/* Enter Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {new Date(joinedAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      Enter <RiArrowRightLine className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center mb-8">
            <RiBuildingLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
              No Organisations Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              You're not part of any organisations yet. Create your first organisation to get started with project management and team collaboration.
            </p>
          </Card>
        )}

        {/* Create Organisation Action */}
        <div className="text-center">
          <Link href="/main/organisations/new">
            <Button size="lg" className="px-8">
              <RiAddLine className="mr-2 h-5 w-5" />
              Create New Organisation
            </Button>
          </Link>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Or ask an organisation owner to invite you to their organisation
          </p>
        </div>
      </div>
    </div>
  );
}