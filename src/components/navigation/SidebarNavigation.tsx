'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiBuildingLine,
  RiDashboardLine,
  RiUserLine,
  RiTeamLine,
  RiShieldLine,
  RiSettings3Line,
  RiMailSendLine,
  RiProjectorLine,
  RiShareLine,
  RiExchangeLine,
  RiDatabaseLine,
  RiLockLine,
} from '@remixicon/react';

type Project = {
  id: string;
  name: string;
  status: string;
};

type Organisation = {
  id: string;
  name: string;
  projects?: Project[];
};

interface SidebarNavigationProps {
  organisations?: Organisation[];
}

export default function SidebarNavigation({
  organisations = [],
}: SidebarNavigationProps) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  const orgSubRoutes = ['members', 'teams', 'roles', 'invitations', 'settings'];

  const orgName = (segments.length >= 1
    && segments[0] !== 'account'
    && segments[0] !== 'admin'
    && segments[0] !== 'orga'
    && segments[0] !== 'signin'
    && segments[0] !== 'register'
    && segments[0] !== 'docs')
    ? segments[0]
    : null;

  const isProjectPage = orgName && segments.length >= 2 && !orgSubRoutes.includes(segments[1]);
  const projectName = isProjectPage ? segments[1] : null;

  const isOrgOverview = orgName && !projectName && (segments.length === 1 || (segments.length === 2 && segments[1] === ''));

  const organisation = orgName
    ? organisations.find(org => org.name === orgName) || null
    : null;

  const projects = organisation?.projects || [];

  if (!orgName) {
    if (organisations.length === 0) return null;
    return (
      <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-screen py-4 px-3">
        <div className="mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Organisations
          </span>
        </div>
        <nav className="space-y-0.5">
          {organisations.map((org) => {
            const orgHref = `/${org.name}`;
            const active = pathname === orgHref || pathname.startsWith(`${orgHref}/`);
            return (
              <Link
                key={org.id}
                href={orgHref}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <RiBuildingLine className="h-4 w-4 shrink-0" />
                {org.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  const orgBase = `/${orgName}`;

  const orgItems = [
    { href: orgBase, label: 'Overview', icon: RiDashboardLine, exact: true },
    { href: `${orgBase}/members`, label: 'Members', icon: RiUserLine },
    { href: `${orgBase}/teams`, label: 'Teams', icon: RiTeamLine },
    { href: `${orgBase}/roles`, label: 'Roles', icon: RiShieldLine },
    { href: `${orgBase}/invitations`, label: 'Invitations', icon: RiMailSendLine },
    { href: `${orgBase}/settings`, label: 'Settings', icon: RiSettings3Line },
  ];

  const projectItems = projectName ? [
    { href: `${orgBase}/${projectName}`, label: 'Resources', icon: RiDatabaseLine, exact: true },
    { href: `${orgBase}/${projectName}/access`, label: 'Access', icon: RiLockLine },
    { href: `${orgBase}/${projectName}/share`, label: 'Share', icon: RiShareLine },
    { href: `${orgBase}/${projectName}/transfer`, label: 'Transfer', icon: RiExchangeLine },
    { href: `${orgBase}/${projectName}/settings`, label: 'Settings', icon: RiSettings3Line },
  ] : [];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-screen py-4 px-3">
      {/* Project section (on top when inside a project) */}
      {projectName && (
        <>
          <div className="mb-2 px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Project
            </span>
          </div>
          <nav className="space-y-0.5">
            {projectItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="my-4 mx-3 border-t border-gray-200 dark:border-gray-700" />
        </>
      )}

      {/* Organisation section */}
      <div className="mb-2 px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Organisation
        </span>
      </div>
      <nav className="space-y-0.5">
        {orgItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Project list (only on org-level pages, not on overview which shows them as content) */}
      {!projectName && !isOrgOverview && projects.length > 0 && (
        <>
          <div className="mt-6 mb-2 px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Projects
            </span>
          </div>
          <nav className="space-y-0.5">
            {projects.map((project) => {
              const projectHref = `${orgBase}/${project.name}`;
              const active = pathname === projectHref || pathname.startsWith(`${projectHref}/`);
              return (
                <Link
                  key={project.id}
                  href={projectHref}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <RiProjectorLine className="h-4 w-4 shrink-0" />
                  {project.name}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
