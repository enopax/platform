'use client';

import Link from 'next/link';
import { RiBuildingLine, RiArrowRightLine, RiProjectorLine, RiUserLine } from '@remixicon/react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

type OwnerInfo = {
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string;
};

interface OrganisationCardProps {
  id: string;
  name: string;
  description: string | null;
  owner: OwnerInfo;
  projectCount: number;
  memberCount: number;
  resourceCount?: number;
  createdAt: Date;
  isActive: boolean;
}

function getOwnerName(owner: OwnerInfo): string {
  if (owner.name) return owner.name;
  if (owner.firstname && owner.lastname) {
    return `${owner.firstname} ${owner.lastname}`;
  }
  return owner.email;
}

export function OrganisationCard({
  id,
  name,
  description,
  owner,
  projectCount,
  memberCount,
  resourceCount = 0,
  createdAt,
  isActive,
}: OrganisationCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer flex flex-col h-full">
      <Link href={`/orga/${name}`} className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex-shrink-0 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colours">
                <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colours">
                  {name}
                </h3>
                {!isActive && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mb-4 pb-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <RiProjectorLine className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {projectCount}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Project{projectCount !== 1 ? 's' : ''}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <RiUserLine className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {memberCount}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Member{memberCount !== 1 ? 's' : ''}
              </div>
            </div>

            {resourceCount > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resourceCount}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Resource{resourceCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - always at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getOwnerName(owner)}
          </div>
          <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colours">
            Open
            <RiArrowRightLine className="ml-1 h-4 w-4" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
