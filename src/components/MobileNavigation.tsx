'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiMenuLine,
  RiCloseLine,
  RiSettings3Line,
} from '@remixicon/react';
import { Button } from '@/components/common/Button';
import { User } from '@prisma/client';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { navigation } from '@/lib/constants/navigation';

interface MobileNavigationProps {
  user: Partial<User>;
}

export default function MobileNavigation({ user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { open } = useCommandPalette();

  const isActivePath = (href: string) => {
    if (href === '/main') {
      return pathname === '/main';
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
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
                Dashboard
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-6 space-y-1 flex-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.description}
                  onClick={handleLinkClick}
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