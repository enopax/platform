'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RiBuildingLine, RiAddLine, RiSearchLine } from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { OrganisationCard } from '@/components/OrganisationCard';
import { Card } from '@/components/common/Card';

type OrganisationType = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  visibility?: string;
  isUserAdmin?: boolean;
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

type FilterType = 'all' | 'admin' | 'public' | 'private';

interface OrganisationsClientProps {
  organisations: OrganisationType[];
}

export function OrganisationsClient({
  organisations
}: OrganisationsClientProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'admin':
        return organisations.filter(org => org.isUserAdmin);
      case 'public':
        return organisations.filter(org => org.visibility === 'PUBLIC');
      case 'private':
        return organisations.filter(org => org.visibility === 'PRIVATE');
      default:
        return organisations;
    }
  }, [organisations, filter]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'admin', label: 'Admin' },
    { key: 'public', label: 'Public' },
    { key: 'private', label: 'Private' },
  ];

  return (
    <div className="flex">
      {/* Filter sidebar — desktop only */}
      {organisations.length > 0 && (
        <aside className="hidden lg:block w-48 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-3rem)] py-4 px-3">
          <div className="mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Filter
            </span>
          </div>
          <nav className="space-y-0.5">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === key
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Organisations
            </h1>
            <Link href="/orga/new">
              <Button>
                <RiAddLine className="mr-2 h-4 w-4" />
                New Organisation
              </Button>
            </Link>
          </div>

          {/* Mobile filter tabs */}
          {organisations.length > 0 && (
            <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto">
              {filters.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    filter === key
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Organisations Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((org) => (
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
          ) : organisations.length > 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No organisations match this filter</p>
            </Card>
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
      </div>
    </div>
  );
}
