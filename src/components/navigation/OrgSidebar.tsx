'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrganisation } from '@/contexts/OrganisationContext';
import {
  RiDashboardLine,
  RiUserLine,
  RiTeamLine,
  RiShieldLine,
  RiSettings3Line,
  RiMailSendLine,
  RiProjectorLine,
} from '@remixicon/react';

export default function OrgSidebar() {
  const pathname = usePathname();
  const organisation = useOrganisation();
  const base = `/${organisation.name}`;

  const items = [
    { href: base, label: 'Overview', icon: RiDashboardLine, exact: true },
    { href: `${base}/members`, label: 'Members', icon: RiUserLine },
    { href: `${base}/teams`, label: 'Teams', icon: RiTeamLine },
    { href: `${base}/roles`, label: 'Roles', icon: RiShieldLine },
    { href: `${base}/invitations`, label: 'Invitations', icon: RiMailSendLine },
    { href: `${base}/settings`, label: 'Settings', icon: RiSettings3Line },
  ];

  const projectItems = organisation.projects?.map((p) => ({
    href: `${base}/${p.name}`,
    label: p.name,
  })) || [];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-screen py-6 px-3">
      <div className="mb-6 px-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {organisation.name}
        </h2>
      </div>

      <nav className="space-y-0.5">
        {items.map((item) => {
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

      {projectItems.length > 0 && (
        <>
          <div className="mt-6 mb-2 px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Projects
            </span>
          </div>
          <nav className="space-y-0.5">
            {projectItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                  <RiProjectorLine className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
