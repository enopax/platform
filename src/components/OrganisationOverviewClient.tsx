'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import Container from '@/components/common/Container';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import ProjectCard from '@/components/project/ProjectCard';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import {
  RiSettings3Line,
  RiProjectorLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine,
  RiMailLine,
  RiShareLine,
} from '@remixicon/react';

interface OrganisationOverviewClientProps {
  canManage: boolean;
  isOrgAdmin?: boolean;
}

export default function OrganisationOverviewClient({
  canManage,
  isOrgAdmin,
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
        </div>


        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h2>
            {canManage && (
              <Link href={`/${organisation.name}/new`}>
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
                <Link href={`/${organisation.name}/new`}>
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

        {organisation.sharedProjects && organisation.sharedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <RiShareLine className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Shared Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organisation.sharedProjects.map((project) => (
                <Link key={project.id} href={`/${project.ownerSlug}/${project.name}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <Badge variant="neutral">Owner: {project.ownerName}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
