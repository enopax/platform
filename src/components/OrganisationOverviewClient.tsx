'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import Container from '@/components/common/Container';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import ProjectCard from '@/components/project/ProjectCard';
import Link from 'next/link';
import {
  RiSettings3Line,
  RiProjectorLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine
} from '@remixicon/react';

interface OrganisationOverviewClientProps {
  canManage: boolean;
}

export default function OrganisationOverviewClient({
  canManage,
}: OrganisationOverviewClientProps) {
  const organisation = useOrganisation();

  return (
    <main className="mt-4">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {organisation.name}
            </h1>
            {organisation.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {organisation.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <RiUserLine className="h-4 w-4" />
                {organisation._count?.members} members
              </span>
              <span className="flex items-center gap-1">
                <RiProjectorLine className="h-4 w-4" />
                {organisation._count?.projects} projects
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/orga/${organisation.name}/members`}>
              <Button variant="light" className="text-sm px-3 py-2">
                <RiUserLine className="mr-2 h-4 w-4" />
                Members
              </Button>
            </Link>
            {canManage && (
              <Link href={`/orga/${organisation.name}/settings`}>
                <Button variant="light" className="text-sm px-3 py-2">
                  <RiSettings3Line className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>


        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h2>
            {canManage && (
              <Link href={`/orga/${organisation.name}/new`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
          </div>

          {organisation.projects && organisation.projects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organisation.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  organisationName={organisation.name}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <RiProjectorLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">No projects yet</p>
              {canManage && (
                <Link href={`/orga/${organisation.name}/new`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>
      </Container>
    </main>
  );
}
