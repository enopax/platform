'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/common/Avatar';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { RiMenuLine, RiSearchLine, RiLockLine } from '@remixicon/react';
import UserBarMenu from '@/components/layout/UserBarMenu';
import { useMobileMenu } from '@/hooks/useMobileMenu';

interface TopNavProps {
  user?: any;
}

export default function UserBar({ user }: TopNavProps) {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const { toggle: toggleMobileMenu } = useMobileMenu();

  const segments = pathname.split('/').filter(Boolean);

  const isOrgPage = segments.length >= 1
    && segments[0] !== 'account'
    && segments[0] !== 'admin'
    && segments[0] !== 'orga'
    && segments[0] !== 'signin'
    && segments[0] !== 'register'
    && segments[0] !== 'docs';

  const orgName = isOrgPage ? segments[0] : null;

  const orgSubRoutes = ['members', 'teams', 'roles', 'invitations', 'settings'];
  const isProjectPage = isOrgPage && segments.length >= 2 && !orgSubRoutes.includes(segments[1]);
  const projectName = isProjectPage ? segments[1] : null;

  return (
    <header className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={toggleMobileMenu}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Toggle menu"
          >
            <RiMenuLine className="h-5 w-5" />
          </button>
        )}

        {orgName && (
          <nav className={`flex items-center gap-1.5 text-sm ${!projectName ? 'hidden lg:flex' : ''}`}>
            <Link
              href={`/${orgName}`}
              className="font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {orgName}
            </Link>
            {projectName && (
              <>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <Link
                  href={`/${orgName}/${projectName}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {projectName}
                </Link>
              </>
            )}
            <RiLockLine className="ml-1 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" title="Private" />
          </nav>
        )}
      </div>

      {/* Right: search + user */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <button
            onClick={open}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[180px]"
          >
            <RiSearchLine className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <kbd className="text-[10px] text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 rounded px-1">&#8984;K</kbd>
          </button>
        )}

        <UserBarMenu user={user} />
      </div>
    </header>
  );
}
