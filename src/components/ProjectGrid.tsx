'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  RiProjectorLine,
  RiAddLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine,
  RiServerLine
} from '@remixicon/react';
import Link from 'next/link';
import { type Project, type Team, type User, type Organisation } from '@prisma/client';

type ProjectWithTeam = Project & {
  team: Team & {
    owner: User;
    organisation?: Organisation | null;
    _count: {
      members: number;
      projects: number;
    };
  };
  resources?: {
    id: string;
    name: string;
    type: string;
  }[];
};

interface ProjectGridProps {
  projects: ProjectWithTeam[];
  selectedTeamName?: string;
}

export default function ProjectGrid({ projects, selectedTeamName }: ProjectGridProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'PLANNING': return 'outline';
      case 'ON_HOLD': return 'outline';
      case 'CANCELLED': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'default';
      case 'HIGH': return 'secondary';
      case 'MEDIUM': return 'outline';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {selectedTeamName ? `${selectedTeamName} Projects` : 'My Projects'} ({projects.length})
      </h2>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3 flex-shrink-0">
                    <RiProjectorLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {project.team.organisation?.name || 'Personal Team'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                    {project.status}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(project.priority)} className="text-xs">
                    {project.priority}
                  </Badge>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Project Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center">
                  <RiTeamLine className="h-3 w-3 mr-1" />
                  <span className="font-medium">{project.team._count.members}</span>
                  <span className="ml-1">team members</span>
                </div>
                {project.startDate && (
                  <div className="flex items-center">
                    <RiCalendarLine className="h-3 w-3 mr-1" />
                    <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center">
                    <RiBarChartLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{project.budget.toString()}</span>
                    <span className="ml-1">{project.currency}</span>
                  </div>
                )}
              </div>

              {/* Resources Status */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <RiServerLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{project.resources?.length || 0}</span>
                    <span className="ml-1">resources</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Team: {project.team.name}
                  </div>
                </div>

                {/* Resource types indicator */}
                {project.resources && project.resources.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {Array.from(new Set(project.resources.map(r => r.type))).map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Link href={`/main/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="text-xs px-3 py-1 w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/main/projects/${project.id}/add-resource`}>
                    <Button size="sm" className="text-xs px-3 py-1">
                      <RiAddLine className="mr-1 h-3 w-3" />
                      Add Resource
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
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