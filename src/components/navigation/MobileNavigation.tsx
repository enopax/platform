'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiMenuLine,
  RiCloseLine,
  RiSettings3Line,
  RiBuildingLine,
  RiProjectorLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiExternalLinkLine,
  RiAddLine,
  RiTeamLine,
  RiServerLine,
  RiUserLine,
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { User } from '@prisma/client';
import { useCommandPalette } from '@/hooks/useCommandPalette';

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

interface MobileNavigationProps {
  user: Partial<User>;
  organisations?: Organisation[];
}

export default function MobileNavigation({ user, organisations: initialOrganisations = [] }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const pathname = usePathname();
  const { open } = useCommandPalette();

  // Get organisation name from pathname
  const getOrganisationName = () => {
    const pathSegments = pathname.split('/');
    if (pathSegments[1] === 'orga' && pathSegments[2]) {
      return pathSegments[2];
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
    if (href === '/orga') {
      return pathname === '/orga' && organisationId;
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    setShowOrgDropdown(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 absolute top-0 z-40 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2"
          >
            {isOpen ? (
              <RiCloseLine className="size-5 shrink-0" />
            ) : (
              <RiMenuLine className="size-5 shrink-0" />
            )}
          </Button>
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">IIIII</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-white">IIIII</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Main
              </h1>
            </div>
          </div>

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
                          href={`/orga/${org.name}`}
                          onClick={handleLinkClick}
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
                          href="/orga/organisations"
                          onClick={handleLinkClick}
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!organisationId ? (
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
          ) : (
            <>
              {/* Projects List */}
              <div className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Projects
                  </h3>
                  <Link href={`/orga/${organisationName}/projects/new`} onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="p-1">
                      <RiAddLine className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {projects.length > 0 ? (
                  <div className="space-y-1">
                    {projects.map((project) => {
                      const projectPath = `/orga/${organisationName}/${project.id}`;
                      const isActive = pathname.startsWith(projectPath);

                      return (
                        <Link
                          key={project.id}
                          href={projectPath}
                          onClick={handleLinkClick}
                          className={`
                            group flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-150
                            ${isActive
                              ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white'
                            }
                          `}
                        >
                          <RiProjectorLine
                            className={`
                              mr-3 h-4 w-4 flex-shrink-0
                              ${isActive
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                              }
                            `}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{project.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={project.status === 'ACTIVE' ? 'success' : 'warning'}
                                className="text-xs"
                              >
                                {project.status}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {project.progress}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RiProjectorLine className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      No projects yet
                    </p>
                    <Link href={`/orga/${organisationName}/projects/new`} onClick={handleLinkClick}>
                      <Button size="sm">
                        <RiAddLine className="mr-2 h-4 w-4" />
                        Create Project
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Organisation Navigation */}
              {organisationId && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Organisation
                  </h4>
                  <div className="space-y-1">
                    {[
                      {
                        name: 'Teams',
                        icon: RiTeamLine,
                        href: `/orga/${organisationName}/teams`,
                        active: pathname.startsWith(`/orga/${organisationName}/teams`)
                      },
                      {
                        name: 'Resources',
                        icon: RiServerLine,
                        href: `/orga/${organisationName}/resources`,
                        active: pathname.startsWith(`/orga/${organisationName}/resources`)
                      },
                      {
                        name: 'Members',
                        icon: RiUserLine,
                        href: `/orga/${organisationName}/members`,
                        active: pathname.startsWith(`/orga/${organisationName}/members`)
                      },
                      {
                        name: 'Settings',
                        icon: RiSettings3Line,
                        href: `/orga/${organisationName}/settings`,
                        active: pathname.startsWith(`/orga/${organisationName}/settings`)
                      },
                    ].map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleLinkClick}
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
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
            <div className="flex items-center mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
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
                onClick={() => {
                  open();
                  setIsOpen(false);
                }}
                className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="mr-2 h-4 w-4 text-xs font-mono border rounded px-1.5 py-0.5 text-gray-500 border-gray-300 dark:border-gray-600">
                  ⌘K
                </span>
                Search
              </Button>
              <Link href="/account/settings" onClick={handleLinkClick}>
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
      </div>
    </>
  );
}