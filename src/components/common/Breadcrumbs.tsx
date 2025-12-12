'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RiArrowRightLine, RiHomeLine } from '@remixicon/react';

interface BreadcrumbItem {
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

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
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
  const segments = pathname.split('/').filter(segment => segment && segment !== 'main');
  const breadcrumbs: BreadcrumbItem[] = [];

  // Check if this is an organisation-specific route
  const isOrgRoute = segments[0] === 'organisations' && segments.length > 1;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;

    // Skip IDs (typically UUIDs or numeric IDs) but handle organisation names
    if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
      // For organisation routes, show organisation name for the ID segment
      if (isOrgRoute && i === 1) {
        // This would be the organisation ID - in real app you'd fetch the name
        breadcrumbs.push({
          label: 'Organisation', // In real app, fetch actual name
          href: isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`
        });
      }
      continue;
    }

    const label = formatSegmentLabel(segment);
    const href = isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`;

    breadcrumbs.push({ label, href });
  }

  return breadcrumbs;
}

function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}