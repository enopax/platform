'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import { Card } from '@/components/common/Card';
import { RiBuildingLine, RiUserLine, RiTeamLine, RiCalendarLine } from '@remixicon/react';

interface OrganisationSettingsOverviewClientProps {
  memberCount?: number;
  teamCount?: number;
  pendingRequests?: number;
}

export function OrganisationSettingsOverviewClient({
  memberCount = 0,
  teamCount = 0,
  pendingRequests = 0
}: OrganisationSettingsOverviewClientProps) {
  const organisation = useOrganisation();

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
          <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Organisation Overview
        </h2>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500">Owner:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {organisation.owner?.name || organisation.owner?.firstname || organisation.owner?.email}
          </span>
        </div>

        <div>
          <span className="text-gray-500">Members:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {memberCount}
          </span>
        </div>

        <div>
          <span className="text-gray-500">Teams:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {teamCount}
          </span>
        </div>

        {pendingRequests > 0 && (
          <div>
            <span className="text-gray-500">Pending Requests:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {pendingRequests}
            </span>
          </div>
        )}

        <div>
          <span className="text-gray-500">Created:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {new Date(organisation.createdAt ?? '').toLocaleDateString('en-GB')}
          </span>
        </div>

        {organisation.description && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Description:</span>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              {organisation.description}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
