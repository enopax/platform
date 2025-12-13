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
  RiUserLine,
  RiShieldLine,
  RiCodeLine,
  RiDatabaseLine,
  RiTeamLine,
  RiMailLine,
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Avatar from '@/components/common/Avatar';
import { User } from '@prisma/client';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { handleSignOut } from '@/actions/auth';

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

  // Find current organisation and its projects from server-provided data
  const organisation = organisationName
    ? initialOrganisations.find(org => org.name === organisationName) || null
    : null;

  const organisationId = organisation?.id; // Get the actual ID from the organisation object

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
      <div className="lg:hidden flex items-center justify-between px-4 absolute top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800">
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
                      {initialOrganisations.map((org) => {
                        const isSelected = org.id === organisationId;
                        return (
                          <Link
                            key={org.id}
                            href={`/orga/${org.name}`}
                            onClick={handleLinkClick}
                            className={`
                              block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4
                              ${isSelected
                                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 dark:border-brand-400'
                                : 'border-transparent'
                              }
                            `}
                          >
                            <div className="flex items-center">
                              <RiBuildingLine className={`mr-3 h-4 w-4 flex-shrink-0 ${
                                isSelected
                                  ? 'text-brand-600 dark:text-brand-400'
                                  : 'text-gray-400 dark:text-gray-600'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className={`text-sm font-medium truncate ${
                                  isSelected
                                    ? 'text-brand-900 dark:text-brand-100'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {org.name}
                                </div>
                                {org._count && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {org._count.projects} projects • {org._count.members} members
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="ml-2 flex-shrink-0">
                                  <div className="h-2 w-2 rounded-full bg-brand-500" />
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                        <Link
                          href="/orga"
                          onClick={handleLinkClick}
                          className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                        >
                          <RiExternalLinkLine className="mr-2 h-4 w-4" />
                          My Organisations
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No organisations found
                      <Link
                        href="/orga/new"
                        onClick={handleLinkClick}
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
              {/* Organisation Navigation */}
              {organisation && (
                <div className="px-3 py-4 flex-1 flex flex-col">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Organisation
                  </h4>
                  <div className="space-y-1">
                    {[
                      {
                        name: 'Projects',
                        icon: RiProjectorLine,
                        href: `/orga/${organisationName}`,
                        active: pathname === `/orga/${organisationName}`
                      },
                      {
                        name: 'Members',
                        icon: RiUserLine,
                        href: `/orga/${organisationName}/members`,
                        active: pathname.startsWith(`/orga/${organisationName}/members`)
                      },
                      {
                        name: 'Roles',
                        icon: RiShieldLine,
                        href: `/orga/${organisationName}/roles`,
                        active: pathname.startsWith(`/orga/${organisationName}/roles`)
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
            {/* User info with avatar */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                name={user.name || user.email || 'User'}
                image={user.image || null}
                size="medium"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email || 'customer@example.com'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-1">
              {/* Smart Search (keep existing) */}
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
                Smart Search
              </Button>

              {/* Account Menu Items */}
              <Link href="/account/developer" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <RiCodeLine className="mr-2 h-4 w-4" />
                  Developer
                </Button>
              </Link>

              <Link href="/account/settings" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>

              {/* Admin Menu Items (conditional) */}
              {user.role === 'ADMIN' && (
                <>
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                  <Link href="/admin" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiDatabaseLine className="mr-2 h-4 w-4" />
                      Nodes
                    </Button>
                  </Link>

                  <Link href="/admin/users" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiUserLine className="mr-2 h-4 w-4" />
                      Users
                    </Button>
                  </Link>

                  <Link href="/admin/organisations" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiBuildingLine className="mr-2 h-4 w-4" />
                      Organisations
                    </Button>
                  </Link>

                  <Link href="/admin/teams" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiTeamLine className="mr-2 h-4 w-4" />
                      Teams
                    </Button>
                  </Link>

                  <Link href="/admin/projects" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiProjectorLine className="mr-2 h-4 w-4" />
                      Projects
                    </Button>
                  </Link>

                  <Link href="/admin/previews/email" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RiMailLine className="mr-2 h-4 w-4" />
                      Preview Email
                    </Button>
                  </Link>
                </>
              )}

              {/* Separator before Sign Out */}
              <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

              {/* Sign Out Button */}
              <form action={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}