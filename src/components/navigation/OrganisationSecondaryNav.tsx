'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RiProjectorLine, RiUserLine, RiShieldLine } from '@remixicon/react';

export default function OrganisationSecondaryNav({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Projects',
      href: `/orga/${orgName}/projects`,
      icon: RiProjectorLine,
    },
    {
      name: 'Members',
      href: `/orga/${orgName}/members`,
      icon: RiUserLine,
    },
    {
      name: 'Roles',
      href: `/orga/${orgName}/roles`,
      icon: RiShieldLine,
    },
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
