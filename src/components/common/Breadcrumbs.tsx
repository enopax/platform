'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RiArrowRightLine } from '@remixicon/react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if no items provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga" className="hover:text-gray-900 dark:hover:text-gray-100">
        Home
      </Link>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <RiArrowRightLine className="h-3 w-3" />
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link href={item.href} className="hover:text-gray-900 dark:hover:text-gray-100">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(segment => segment);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Pattern: /account/...
  if (segments[0] === 'account') {
    breadcrumbs.push({
      label: 'Account',
      href: '/account/settings'
    });

    if (segments[1]) {
      const page = segments[1];
      breadcrumbs.push({
        label: formatSegmentLabel(page)
      });
    }

    return breadcrumbs;
  }

  // Pattern: /orga/orgaName/projectName/resourceName
  if (segments[0] !== 'orga' || !segments[1]) {
    return breadcrumbs;
  }

  const orgaName = segments[1];

  breadcrumbs.push({
    label: orgaName,
    href: `/orga/${orgaName}`
  });

  // Pattern: /orga/orgaName/projectName/...
  if (segments[2]) {
    const projectName = segments[2];
    breadcrumbs.push({
      label: projectName,
      href: `/orga/${orgaName}/${projectName}`
    });

    // Pattern: /orga/orgaName/projectName/resourceName
    if (segments[3]) {
      const resourceName = segments[3];
      breadcrumbs.push({
        label: resourceName
      });
    }
  }

  return breadcrumbs;
}

function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}