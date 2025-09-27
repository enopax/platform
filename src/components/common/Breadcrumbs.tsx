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

// Custom breadcrumbs for project pages
export function ProjectBreadcrumbs({
  projectName,
  projectId,
  currentPage
}: {
  projectName: string;
  projectId: string;
  currentPage?: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/main" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
        <RiHomeLine className="h-4 w-4 mr-1" />
        Dashboard
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href="/main/projects" className="hover:text-gray-900 dark:hover:text-gray-100">
        Projects
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/main/projects/${projectId}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {projectName}
      </Link>
      {currentPage && (
        <>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">{currentPage}</span>
        </>
      )}
    </nav>
  );
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if no items provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/main" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
        <RiHomeLine className="h-4 w-4 mr-1" />
        Dashboard
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
  const segments = pathname.split('/').filter(segment => segment && segment !== 'main');
  const breadcrumbs: BreadcrumbItem[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;

    // Skip IDs (typically UUIDs or numeric IDs)
    if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
      continue;
    }

    const label = formatSegmentLabel(segment);
    const href = isLast ? undefined : `/main/${segments.slice(0, i + 1).join('/')}`;

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