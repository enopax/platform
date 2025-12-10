import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import OrganisationSearchSection from '../OrganisationSearchSection';
import LeaveOrganisationButton from '@/components/form/LeaveOrganisationButton';
import {
  RiBuildingLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine,
  RiProjectorLine,
  RiSettings4Line,
  RiSearchLine,
  RiArrowRightLine
} from '@remixicon/react';
import Link from 'next/link';

export default async function OrganisationsPage() {
  const session = await auth();

  const isAdmin = session.user.role === 'ADMIN';

  // Fetch user's organisation memberships or all organisations for admin
  const organisationMemberships = isAdmin
    ? await prisma.organisation.findMany({
        where: { isActive: true },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                  image: true
                }
              }
            },
            orderBy: [
              { role: 'asc' },
              { joinedAt: 'asc' }
            ]
          },
          _count: {
            select: {
              members: true,
              teams: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
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
                  teams: true
                }
              }
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'MANAGER': return 'secondary';
      case 'MEMBER': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organisations
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your organisations and discover new ones
            </p>
          </div>
          <Link href="/orga/new">
            <Button className="w-full sm:w-auto">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Organisation
            </Button>
          </Link>
        </div>
      </div>

      {organisationMemberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organisationMemberships.map(({ organisation, role, joinedAt }) => (
            <Card key={organisation.id} className="p-6 hover:shadow-lg transition-all group cursor-pointer">
              <Link href={`/orga/${organisation.name}`} className="block">
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
                    Details <RiArrowRightLine className="ml-1 h-4 w-4" />
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

      {/* Organisation Search Section */}
      <OrganisationSearchSection />

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/orga/new" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiAddLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create New Organisation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new organisation and invite your team members
              </p>
            </div>
          </Link>

          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer group">
            <RiUserLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Request Membership</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search for organisations and request to join them
            </p>
          </div>
        </div>
      </Card>

      {/* Organisation Context Info */}
      {organisationMemberships.length > 1 && (
        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
              <RiBuildingLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Multiple Organisations
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You're part of {organisationMemberships.length} organisations. Use the organisation selector to switch context and view different teams, projects, and files.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}