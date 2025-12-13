'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiProjectorLine, RiAddLine } from '@remixicon/react';
import Link from 'next/link';
import { ProjectCard, type ProjectWithTeamsAndResources } from './ProjectCard';

interface ProjectGridProps {
  projects: ProjectWithTeamsAndResources[];
  selectedTeamName?: string;
}

export default function ProjectGrid({ projects, selectedTeamName }: ProjectGridProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {selectedTeamName ? `${selectedTeamName} Projects` : 'My Projects'} ({projects.length})
      </h2>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiProjectorLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {selectedTeamName ? `No projects in ${selectedTeamName}` : 'No projects yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            {selectedTeamName
              ? `Create your first project for the ${selectedTeamName} team.`
              : "You're not part of any projects yet. Create your first project or search for existing ones to join."
            }
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/main/projects/new">
              <Button>
                <RiAddLine className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}