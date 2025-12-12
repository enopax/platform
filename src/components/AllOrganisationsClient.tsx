'use client';

import Link from 'next/link';
import { RiBuildingLine, RiAddLine } from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { OrganisationCard } from '@/components/OrganisationCard';
import OrganisationSearchSection from '@/components/OrganisationSearchSection';
import { Card } from '@/components/common/Card';

type OrganisationType = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  owner: {
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  _count: {
    projects: number;
    members: number;
    resources?: number;
  };
  createdAt: Date;
};

interface AllOrganisationsClientProps {
  organisations: OrganisationType[];
}

export function AllOrganisationsClient({
  organisations
}: AllOrganisationsClientProps) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <RiBuildingLine className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Organisations
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {organisations.length === 0
                ? 'Create your first organisation to get started'
                : `${organisations.length} organisation${organisations.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex-shrink-0">
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
      {organisations.length > 0 && (
        <div className="mb-8">
          <OrganisationSearchSection />
        </div>
      )}

      {/* Organisations Grid */}
      {organisations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organisations.map((org) => (
            <OrganisationCard
              key={org.id}
              id={org.id}
              name={org.name}
              description={org.description}
              isActive={org.isActive}
              owner={org.owner}
              projectCount={org._count.projects}
              memberCount={org._count.members}
              resourceCount={org._count.resources || 0}
              createdAt={org.createdAt}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiBuildingLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
            No Organisations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Create your first organisation to start managing projects and resources.
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
