'use client';

import { useState } from 'react';
import { Select, SelectValue } from '@/components/common/Select';
import { useOrganisation } from '@/components/context/OrganisationContext';
import { Organisation } from '@prisma/client';
import { RiBuildingLine, RiAddLine } from '@remixicon/react';
import { Button } from '@/components/common/Button';
import Link from 'next/link';

export default function OrganisationSelector() {
  const { selectedOrganisation, setSelectedOrganisation, organisations, isLoading } = useOrganisation();

  const handleOrganisationChange = (value: string) => {
    if (value === 'create-new') {
      // Handle create new organisation
      return;
    }

    const org = organisations.find(o => o.id === value);
    setSelectedOrganisation(org || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="animate-pulse flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (organisations.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <RiBuildingLine className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            No Organisations
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You need to be part of an organisation to access the main dashboard.
          </p>
          <Link href="/orga/new">
            <Button size="sm">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Organisation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Organisation Context
      </label>
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <Select
            value={selectedOrganisation?.id || ''}
            onValueChange={handleOrganisationChange}
          >
            <SelectValue
              placeholder="Select organisation..."
              className="flex items-center"
            >
              {selectedOrganisation && (
                <div className="flex items-center">
                  <RiBuildingLine className="mr-2 h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span className="truncate">{selectedOrganisation.name}</span>
                </div>
              )}
            </SelectValue>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
        </div>

        <Link href="/orga/new">
          <Button variant="outline" size="sm">
            <RiAddLine className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {selectedOrganisation && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing data for <span className="font-medium">{selectedOrganisation.name}</span>
        </div>
      )}
    </div>
  );
}