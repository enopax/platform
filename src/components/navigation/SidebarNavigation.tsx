'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiSettings3Line,
  RiServerLine,
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { User } from '@prisma/client';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { navigation } from '@/lib/constants/navigation';

export default function SidebarNavigation({
  user,
}: {
  user: Partial<User>,
}) {
  const pathname = usePathname();
  const { open } = useCommandPalette();

  const isActivePath = (href: string) => {
    if (href === '/main') {
      return pathname === '/main';
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

      {/* Navigation */}
      <nav className="px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.description}
              className={`
                group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-150
                ${isActive
                  ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors
                  ${isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                  }
                `}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate">{item.name}</div>
                {!isActive && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

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