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

// Custom breadcrumbs for project pages (global context)
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
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
        <RiHomeLine className="h-4 w-4 mr-1" />
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Projects
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/organisations`} className="hover:text-gray-900 dark:hover:text-gray-100">
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

// Custom breadcrumbs for organisation-specific project pages
export function OrganisationProjectBreadcrumbs({
  organisationId,
  organisationName,
  projectName,
  projectId,
  currentPage
}: {
  organisationId: string;
  organisationName: string;
  projectName: string;
  projectId: string;
  currentPage?: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {organisationName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/projects`} className="hover:text-gray-900 dark:hover:text-gray-100">
        Projects
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/${projectName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
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

// Custom breadcrumbs for organisation-specific team pages
export function OrganisationTeamBreadcrumbs({
  organisationId,
  organisationName,
  teamName,
  teamId,
  currentPage
}: {
  organisationId: string;
  organisationName: string;
  teamName: string;
  teamId: string;
  currentPage?: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {organisationName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/teams`} className="hover:text-gray-900 dark:hover:text-gray-100">
        Teams
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/teams/${teamId}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {teamName}
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

// Custom breadcrumbs for organisation-specific resource pages
export function OrganisationResourceBreadcrumbs({
  organisationId,
  organisationName,
  resourceName,
  resourceId,
  currentPage
}: {
  organisationId: string;
  organisationName: string;
  resourceName: string;
  resourceId: string;
  currentPage?: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {organisationName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/resources`} className="hover:text-gray-900 dark:hover:text-gray-100">
        Resources
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/resources/${resourceId}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {resourceName}
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
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
        <RiHomeLine className="h-4 w-4 mr-1" />
        Organisations
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
          href: isLast ? undefined : `/main/${segments.slice(0, i + 1).join('/')}`
        });
      }
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

// Simplified breadcrumbs for organisation pages (no intermediate categories)
export function SimpleOrganisationBreadcrumbs({
  organisationName,
}: {
  organisationName: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <span className="text-gray-900 dark:text-gray-100 font-medium">{organisationName}</span>
    </nav>
  );
}

// Simplified breadcrumbs for project pages (no intermediate categories)
export function SimpleProjectBreadcrumbs({
  organisationName,
  projectName,
}: {
  organisationName: string;
  projectName: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {organisationName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <span className="text-gray-900 dark:text-gray-100 font-medium">{projectName}</span>
    </nav>
  );
}

// Simplified breadcrumbs for resource pages (no intermediate categories)
export function SimpleResourceBreadcrumbs({
  organisationName,
  projectName,
  resourceName,
}: {
  organisationName: string;
  projectName: string;
  resourceName: string;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link href="/orga/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
        Organisations
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {organisationName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <Link href={`/orga/${organisationName}/${projectName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
        {projectName}
      </Link>
      <RiArrowRightLine className="h-3 w-3" />
      <span className="text-gray-900 dark:text-gray-100 font-medium">{resourceName}</span>
    </nav>
  );
}