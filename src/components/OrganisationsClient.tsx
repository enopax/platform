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

interface OrganisationsClientProps {
  organisations: OrganisationType[];
}

export function OrganisationsClient({
  organisations
}: OrganisationsClientProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    let result = organisations;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(org =>
        org.name.toLowerCase().includes(q) ||
        org.description?.toLowerCase().includes(q)
      );
    }

    if (sort === 'recent') {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [organisations, search, sort]);

  return (
    <div className="flex">
      {/* Filter sidebar — desktop only */}
      {organisations.length > 0 && (
        <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-3rem)] py-4 px-3">
          <div className="mb-4 px-1">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find an organisation..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="px-1">
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Sort by
              </span>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="name">Name</option>
              <option value="recent">Recently created</option>
            </select>
          </div>
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
              <RiSearchLine className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No organisations match your search</p>
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
