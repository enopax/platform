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
  description?: string;
  _count?: {
    projects: number;
    teams: number;
    members: number;
  };
};

export default function SidebarNavigation({
  user,
}: {
  user: Partial<User>,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open } = useCommandPalette();

  const [projects, setProjects] = useState<Project[]>([]);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  // Get organisation ID from pathname
  const getOrganisationId = () => {
    // Check if we're on an organisation tree page (/main/organisations/[id]/...)
    const pathSegments = pathname.split('/');
    if (pathSegments[1] === 'main' && pathSegments[2] === 'organisations' && pathSegments[3]) {
      return pathSegments[3];
    }

    return null;
  };

  const organisationId = getOrganisationId();

  // Fetch user organisations and selected organisation data
  useEffect(() => {
    async function fetchOrganisations() {
      try {
        // Fetch all user's organisations
        const response = await fetch('/api/organisations');
        if (response.ok) {
          const data = await response.json();
          setOrganisations(data.organisations || []);
        }
      } catch (error) {
        console.error('Error fetching organisations:', error);
      }
    }

    fetchOrganisations();
  }, []);

  // Fetch projects and organisation data for selected organisation
  useEffect(() => {
    if (!organisationId) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch organisation info
        const orgResponse = await fetch(`/api/organisations/${organisationId}`);
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setOrganisation(orgData);
        }

        // Fetch projects in this organisation
        const projectsResponse = await fetch(`/api/organisations/${organisationId}/projects`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [organisationId]);

  const isActivePath = (href: string) => {
    if (href === '/main') {
      return pathname === '/main' && organisationId;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 min-h-screen border-r flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center h-16 px-6 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-sm font-bold text-white">IIIII</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dashboard
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
              {organisations.length > 0 ? (
                <>
                  {organisations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/main/organisations/${org.id}`}
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
              <Link href={`/main/organisations/${organisationId}/projects/new`}>
                <Button variant="ghost" size="sm" className="p-1">
                  <RiAddLine className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-1">
                {projects.map((project) => {
                  // Determine if we're in organisation context based on current path
                  const isInOrgContext = pathname.startsWith('/main/organisations/');

                  // Use organisation-specific links when in organisation context, global links otherwise
                  const projectPath = isInOrgContext
                    ? `/main/organisations/${organisationId}/projects/${project.id}`
                    : `/main/projects/${project.id}`;

                  const globalProjectPath = `/main/projects/${project.id}`;
                  const orgProjectPath = `/main/organisations/${organisationId}/projects/${project.id}`;
                  const isActive = pathname.startsWith(orgProjectPath) || pathname.startsWith(globalProjectPath);

                  return (
                    <Link
                      key={project.id}
                      href={projectPath}
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
                <Link href={`/main/organisations/${organisationId}/projects/new`}>
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
                    href: `/main/organisations/${organisationId}/teams`,
                    active: pathname.startsWith(`/main/organisations/${organisationId}/teams`)
                  },
                  {
                    name: 'Resources',
                    icon: RiServerLine,
                    href: `/main/organisations/${organisationId}/resources`,
                    active: pathname.startsWith(`/main/organisations/${organisationId}/resources`)
                  },
                  {
                    name: 'Members',
                    icon: RiUserLine,
                    href: `/main/organisations/${organisationId}/members`,
                    active: pathname.startsWith(`/main/organisations/${organisationId}/members`)
                  },
                  {
                    name: 'Settings',
                    icon: RiSettings3Line,
                    href: `/main/organisations/${organisationId}/settings`,
                    active: pathname.startsWith(`/main/organisations/${organisationId}/settings`)
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

          {/* Project Navigation (when inside a project) */}
          {pathname.includes('/projects/') && pathname.split('/')[3] && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Project Tools
              </h4>
              <div className="space-y-1">
                {[
                  { name: 'Teams', icon: RiTeamLine, href: '#teams' },
                  { name: 'Resources', icon: RiServerLine, href: '#resources' },
                  { name: 'Files', icon: RiFileTextLine, href: '#files' },
                  { name: 'Analytics', icon: RiBarChartLine, href: '#analytics' },
                ].map((item) => (
                  <button
                    key={item.name}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white rounded-lg transition-colors"
                  >
                    <item.icon className="mr-3 h-4 w-4 text-gray-400" />
                    <span>{item.name}</span>
                  </button>
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