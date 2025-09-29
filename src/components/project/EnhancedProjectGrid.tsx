'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import {
  RiProjectorLine,
  RiAddLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine,
  RiServerLine,
  RiSearchLine,
  RiGridLine,
  RiMenuLine,
  RiFilterLine,
  RiSortAscLine
} from '@remixicon/react';
import Link from 'next/link';
import { useState } from 'react';
import { type Project, type Team, type User, type Organisation } from '@prisma/client';

type ProjectWithTeamsAndResources = Project & {
  organisation: {
    id: string;
    name: string;
  };
  assignedTeams: {
    team: Team & {
      owner: User;
      _count: {
        members: number;
        assignedProjects: number;
      };
    };
  }[];
  allocatedResources?: {
    resource: {
      id: string;
      name: string;
      type: string;
    };
  }[];
};

interface EnhancedProjectGridProps {
  projects: ProjectWithTeamsAndResources[];
  selectedTeamName?: string;
}

export default function EnhancedProjectGrid({ projects, selectedTeamName }: EnhancedProjectGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'progress' | 'date'>('name');

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.organisation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.assignedTeams.some(at => at.team.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 dark:text-green-400';
      case 'COMPLETED': return 'text-blue-600 dark:text-blue-400';
      case 'PLANNING': return 'text-yellow-600 dark:text-yellow-400';
      case 'ON_HOLD': return 'text-orange-600 dark:text-orange-400';
      case 'CANCELLED': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="mb-8">
      {/* Enhanced Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {selectedTeamName ? `${selectedTeamName} Projects` : 'My Projects'} ({filteredProjects.length})
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Sort and View Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="progress">Sort by Progress</option>
              <option value="date">Sort by Date</option>
            </select>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <RiGridLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <RiMenuLine className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-4"
        }>
          {filteredProjects.map((project) => (
            <Card key={project.id} className={`p-4 hover:shadow-lg transition-all duration-200 ${
              viewMode === 'list' ? 'flex items-center gap-6' : ''
            }`}>
              <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1' : 'mb-3'}`}>
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3 flex-shrink-0">
                    <RiProjectorLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {project.organisation.name}
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

              {viewMode === 'grid' && (
                <>
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
                      <span className="font-medium">{project.assignedTeams.reduce((total, at) => total + at.team._count.members, 0)}</span>
                      <span className="ml-1">members</span>
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
                        <span className="font-medium">{project.allocatedResources?.length || 0}</span>
                        <span className="ml-1">resources</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Teams: {project.assignedTeams.length > 0 ? project.assignedTeams.map(at => at.team.name).join(', ') : 'Unassigned'}
                      </div>
                    </div>

                    {/* Resource types indicator */}
                    {project.allocatedResources && project.allocatedResources.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {Array.from(new Set(project.allocatedResources.map(r => r.resource.type))).map((type) => (
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
                      <Link href={`/main/organisations/${project.organisation.id}/projects/${project.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="text-xs px-3 py-1 w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/main/organisations/${project.organisation.id}/projects/${project.id}/add-resource`}>
                        <Button size="sm" className="text-xs px-3 py-1">
                          <RiAddLine className="mr-1 h-3 w-3" />
                          Add Resource
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {viewMode === 'list' && (
                <div className="flex items-center gap-6">
                  {/* Progress */}
                  <div className="w-24 flex-shrink-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {project.progress}%
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-brand-600 dark:bg-brand-500 h-1.5 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <RiTeamLine className="h-3 w-3 mr-1" />
                      <span>{project.assignedTeams.reduce((total, at) => total + at.team._count.members, 0)}</span>
                    </div>
                    <div className="flex items-center">
                      <RiServerLine className="h-3 w-3 mr-1" />
                      <span>{project.allocatedResources?.length || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/main/organisations/${project.organisation.id}/projects/${project.id}`}>
                      <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                        View
                      </Button>
                    </Link>
                    <Link href={`/main/organisations/${project.organisation.id}/projects/${project.id}/add-resource`}>
                      <Button size="sm" className="text-xs px-3 py-1">
                        <RiAddLine className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiProjectorLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No projects found' : (selectedTeamName ? `No projects in ${selectedTeamName}` : 'No projects yet')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            {searchTerm
              ? `No projects match "${searchTerm}". Try adjusting your search terms.`
              : selectedTeamName
                ? `Create your first project for the ${selectedTeamName} team.`
                : "You're not part of any projects yet. Create your first project or search for existing ones to join."
            }
          </p>
          <div className="flex justify-center gap-4">
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            ) : (
              <Link href="/main/projects/new">
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}