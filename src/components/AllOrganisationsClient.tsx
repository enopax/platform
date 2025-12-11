'use client';

import Link from 'next/link';
import {
  RiBuildingLine,
  RiProjectorLine,
  RiTeamLine,
  RiUserLine,
  RiArrowRightLine,
  RiAddLine
} from '@remixicon/react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import OrganisationSearchSection from '@/components/OrganisationSearchSection';

type OrganisationType = {
  id: string;
  name: string;
  description: string | null;
  owner: {
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  _count: {
    projects: number;
    teams: number;
    members: number;
  };
  createdAt: Date;
};

interface AllOrganisationsClientProps {
  organisations: OrganisationType[];
}

function getOwnerName(owner: OrganisationType['owner']): string {
  if (owner.name) return owner.name;
  if (owner.firstname && owner.lastname) {
    return `${owner.firstname} ${owner.lastname}`;
  }
  return owner.email;
}

export function AllOrganisationsClient({
  organisations
}: AllOrganisationsClientProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <RiBuildingLine className="h-6 w-6 text-brand-600 dark:text-brand-400 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Organisations
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Select an organisation to view projects, teams, and resources
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orga/new">
              <Button>
                <RiAddLine className="mr-2 h-4 w-4" />
                New Organisation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <OrganisationSearchSection />
      </div>

      {/* Organisations Grid */}
      {organisations.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Organisations ({organisations.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organisations.map((org) => (
              <Card
                key={org.id}
                className="p-6 hover:shadow-lg transition-all group cursor-pointer"
              >
                <Link href={`/orga/${org.name}`} className="block">
                  {/* Organisation Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl mr-4 flex-shrink-0 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                        <RiBuildingLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors">
                          {org.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          Organisation
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {org.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiProjectorLine className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {org._count.projects}
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
                        {org._count.teams}
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
                        {org._count.members}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Members
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Owner: {getOwnerName(org.owner)}
                    </div>
                    <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      Open <RiArrowRightLine className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiBuildingLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
            No Organisations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Create your first organisation to start collaborating with your team.
          </p>
          <Link href="/orga/new">
            <Button size="lg">
              <RiAddLine className="mr-2 h-5 w-5" />
              Create First Organisation
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
