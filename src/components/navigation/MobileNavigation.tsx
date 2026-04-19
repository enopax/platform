'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiCloseLine,
  RiDashboardLine,
  RiUserLine,
  RiTeamLine,
  RiShieldLine,
  RiSettings3Line,
  RiMailSendLine,
  RiProjectorLine,
  RiDatabaseLine,
  RiLockLine,
  RiShareLine,
  RiExchangeLine,
} from '@remixicon/react';
import { useMobileMenu } from '@/hooks/useMobileMenu';

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

interface MobileNavigationProps {
  organisations?: Organisation[];
}

export default function MobileNavigation({ organisations = [] }: MobileNavigationProps) {
  const { isOpen, close: onClose } = useMobileMenu();
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
  const isOrgOverview = orgName && !projectName && segments.length === 1;

  const organisation = orgName
    ? organisations.find(org => org.name === orgName) || null
    : null;

  const projects = organisation?.projects || [];
  const orgBase = orgName ? `/${orgName}` : '';

  const orgItems = orgName ? [
    { href: orgBase, label: 'Overview', icon: RiDashboardLine, exact: true },
    { href: `${orgBase}/members`, label: 'Members', icon: RiUserLine },
    { href: `${orgBase}/teams`, label: 'Teams', icon: RiTeamLine },
    { href: `${orgBase}/roles`, label: 'Roles', icon: RiShieldLine },
    { href: `${orgBase}/invitations`, label: 'Invitations', icon: RiMailSendLine },
    { href: `${orgBase}/settings`, label: 'Settings', icon: RiSettings3Line },
  ] : [];

  const projectItems = projectName ? [
    { href: `${orgBase}/${projectName}`, label: 'Resources', icon: RiDatabaseLine, exact: true },
    { href: `${orgBase}/${projectName}/access`, label: 'Access', icon: RiLockLine },
    { href: `${orgBase}/${projectName}/share`, label: 'Share', icon: RiShareLine },
    { href: `${orgBase}/${projectName}/transfer`, label: 'Transfer', icon: RiExchangeLine },
    { href: `${orgBase}/${projectName}/settings`, label: 'Settings', icon: RiSettings3Line },
  ] : [];

  return (
    <>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      )}

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400">
              <RiCloseLine className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
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
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
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
            {orgName && (
              <>
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
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
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
              </>
            )}

            {/* Project list */}
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
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
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
          </div>
        </div>
      </div>
    </>
  );
}
