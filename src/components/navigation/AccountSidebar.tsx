'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiUserSettingsLine, RiCodeBoxLine, RiBankCardLine, RiArrowLeftLine } from '@remixicon/react';

const ITEMS = [
  { href: '/account/settings', label: 'Profile', icon: RiUserSettingsLine },
  { href: '/account/developer', label: 'Developer', icon: RiCodeBoxLine },
  { href: '/account/payment', label: 'Payment', icon: RiBankCardLine },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 min-h-screen py-8 px-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <RiArrowLeftLine className="h-3 w-3 mr-1" />
          Back to app
        </Link>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Account
        </h2>
      </div>

      <nav className="space-y-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
