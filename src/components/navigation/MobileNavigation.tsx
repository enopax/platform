'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RiCloseLine,
  RiBuildingLine,
  RiUserLine,
} from '@remixicon/react';
import { useMobileMenu } from '@/hooks/useMobileMenu';

interface MobileNavigationProps {
  user?: any;
}

export default function MobileNavigation({ user }: MobileNavigationProps) {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={close} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <button onClick={close} className="p-1 text-gray-500 dark:text-gray-400">
              <RiCloseLine className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-2 px-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Navigation
              </span>
            </div>
            <nav className="space-y-0.5">
              <Link
                href="/orga"
                onClick={close}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === '/orga'
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <RiBuildingLine className="h-4 w-4 shrink-0" />
                Organisations
              </Link>

              {user?.role === 'SUPERADMIN' && (
                <>
                  <div className="mt-4 mb-2 px-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Admin
                    </span>
                  </div>
                  <Link
                    href="/admin/users"
                    onClick={close}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RiUserLine className="h-4 w-4 shrink-0" />
                    Users
                  </Link>
                  <Link
                    href="/admin/organisations"
                    onClick={close}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RiBuildingLine className="h-4 w-4 shrink-0" />
                    Organisations
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
