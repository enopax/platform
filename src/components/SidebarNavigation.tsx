'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiDashboardLine,
  RiProjectorLine,
  RiTeamLine,
  RiBuildingLine,
  RiCodeLine,
  RiSettings3Line,
  RiServerLine,
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { User } from '@prisma/client';

const navigation = [
  { name: 'Dashboard', href: '/main', icon: RiDashboardLine },
  { name: 'Projects', href: '/main/projects', icon: RiProjectorLine },
  { name: 'Teams', href: '/main/teams', icon: RiTeamLine },
  { name: 'Resources', href: '/main/resources', icon: RiServerLine },
  { name: 'Organisations', href: '/main/organisations', icon: RiBuildingLine },
  { name: 'Developer', href: '/main/developer', icon: RiCodeLine },
];

export default function SidebarNavigation({
  user,
}: {
  user: Partial<User>,
}) {
  const pathname = usePathname();

  const isActivePath = (href: string) => {
    if (href === '/main') {
      return pathname === '/main';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 min-h-screen">
      {/* Header */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          IPFS Storage
        </h1>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                  ? 'bg-brand-100 text-brand-900 dark:bg-brand-900 dark:text-brand-100'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive 
                    ? 'text-brand-600 dark:text-brand-400' 
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  }
                `}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 mt-auto">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">U</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer
            </p>
          </div>
        </div>

        <Link href="/account/settings">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
          >
            <RiSettings3Line className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}