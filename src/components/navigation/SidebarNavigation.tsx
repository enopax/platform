'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  RiSettings3Line,
  RiServerLine,
  RiBuildingLine,
  RiProjectorLine,
  RiTeamLine,
  RiArrowDownSLine,
  RiFileTextLine,
  RiBarChartLine,
  RiAddLine,
  RiArrowUpSLine,
  RiExternalLinkLine,
  RiUserLine
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { User } from '@prisma/client';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { Badge } from '@/components/common/Badge';

type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  organisationId: string;
};

type Organisation = {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    projects: number;
    teams: number;
    members: number;
  };
  projects?: Project[];
};

export default function SidebarNavigation({
  user,
  organisations: initialOrganisations = [],
}: {
  user: Partial<User>;
  organisations?: Organisation[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open } = useCommandPalette();

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  // Get organisation name from pathname
  const getOrganisationName = () => {
    // Check if we're on an organisation tree page (/main/organisations/[orgName]/...)
    const pathSegments = pathname.split('/');
    if (pathSegments[1] === 'main' && pathSegments[2] === 'organisations' && pathSegments[3]) {
      return pathSegments[3];
    }

    return null;
  };

  const organisationName = getOrganisationName();
  const organisationId = organisationName; // Keep for backward compatibility in checks

  // Find current organisation and its projects from server-provided data
  const organisation = organisationName
    ? initialOrganisations.find(org => org.name === organisationName) || null
    : null;

  const projects = organisation?.projects || [];

  const isActivePath = (href: string) => {
    if (href === '/main') {
      return pathname === '/main' && organisationId;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 min-h-screen border-r flex flex-col flex-shrink-0">

      {/* Organisation Selector */}
      <div className="px-3 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center min-w-0 flex-1">
              <RiBuildingLine className="mr-3 h-5 w-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                {organisation ? (
                  <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {organisation.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Current organisation
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Select organisation
                  </div>
                )}
              </div>
            </div>
            {showOrgDropdown ? (
              <RiArrowUpSLine className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <RiArrowDownSLine className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {/* Dropdown */}
          {showOrgDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {initialOrganisations.length > 0 ? (
                <>
                  {initialOrganisations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/main/organisations/${org.name}`}
                      onClick={() => setShowOrgDropdown(false)}
                      className={`
                        block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                        ${org.id === organisationId ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <RiBuildingLine className="mr-3 h-4 w-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium truncate ${
                            org.id === organisationId
                              ? 'text-brand-900 dark:text-brand-100'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {org.name}
                          </div>
                          {org._count && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {org._count.projects} projects • {org._count.teams} teams
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    <Link
                      href="/main/organisations"
                      onClick={() => setShowOrgDropdown(false)}
                      className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    >
                      <RiExternalLinkLine className="mr-2 h-4 w-4" />
                      View all organisations
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No organisations found
                  <Link
                    href="/main/organisations/new"
                    onClick={() => setShowOrgDropdown(false)}
                    className="block mt-2 text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Create one
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!organisationId && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <RiBuildingLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No organisation selected
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use the dropdown above to select one
            </p>
          </div>
        </div>
      )}

          {/* Organisation Navigation */}
          {organisationId && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Organisation
              </h4>
              <div className="space-y-1">
                {[
                  {
                    name: 'Projects',
                    icon: RiTeamLine,
                    href: `/main/organisations/${organisationName}/projects`,
                    active: pathname.startsWith(`/main/organisations/${organisationName}/projects`)
                  },
                  {
                    name: 'Teams',
                    icon: RiTeamLine,
                    href: `/main/organisations/${organisationName}/teams`,
                    active: pathname.startsWith(`/main/organisations/${organisationName}/teams`)
                  },
                  {
                    name: 'Resources',
                    icon: RiServerLine,
                    href: `/main/organisations/${organisationName}/resources`,
                    active: pathname.startsWith(`/main/organisations/${organisationName}/resources`)
                  },
                  {
                    name: 'Members',
                    icon: RiUserLine,
                    href: `/main/organisations/${organisationName}/members`,
                    active: pathname.startsWith(`/main/organisations/${organisationName}/members`)
                  },
                  {
                    name: 'Settings',
                    icon: RiSettings3Line,
                    href: `/main/organisations/${organisationName}/settings`,
                    active: pathname.startsWith(`/main/organisations/${organisationName}/settings`)
                  },
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                      ${item.active
                        ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-4 w-4
                        ${item.active
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-400'
                        }
                      `}
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* User section */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex items-center mb-3">
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.email || 'customer@example.com'}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={open}
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <span className="mr-2 h-4 w-4 text-xs font-mono border rounded px-1.5 py-0.5 text-gray-500 border-gray-300 dark:border-gray-600">
              ⌘K
            </span>
            Smart Search
          </Button>
          <Link href="/account/settings">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <RiSettings3Line className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}