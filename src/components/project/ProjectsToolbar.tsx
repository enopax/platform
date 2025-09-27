'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import {
  RiSearchLine,
  RiFilterLine,
  RiGridLine,
  RiMenuLine,
  RiSortAscLine,
  RiMoreLine,
  RiCheckboxMultipleLine,
  RiDeleteBin7Line,
  RiArchiveLine,
  RiEyeLine
} from '@remixicon/react';
import { Badge } from '@/components/common/Badge';

interface ProjectsToolbarProps {
  totalProjects: number;
  selectedProjects: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function ProjectsToolbar({
  totalProjects,
  selectedProjects,
  onSelectAll,
  onDeselectAll,
  viewMode,
  onViewModeChange
}: ProjectsToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'newest') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`?${params.toString()}`);
  };

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    router.push(`?${params.toString()}`);
  };

  const selectedCount = selectedProjects.length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select onValueChange={handleStatusFilter} defaultValue={searchParams.get('status') || 'all'}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={handleSortChange} defaultValue={searchParams.get('sort') || 'newest'}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="border-0 rounded-r-none"
            >
              <RiGridLine className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="border-0 rounded-l-none"
            >
              <RiMenuLine className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RiCheckboxMultipleLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span className="font-medium text-brand-900 dark:text-brand-100">
                {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedCount === totalProjects ? onDeselectAll : onSelectAll}
                className="border-brand-300 dark:border-brand-700"
              >
                {selectedCount === totalProjects ? 'Deselect All' : `Select All ${totalProjects}`}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-brand-300 dark:border-brand-700">
              <RiEyeLine className="w-4 h-4 mr-2" />
              View Selected
            </Button>
            <Button variant="outline" size="sm" className="border-brand-300 dark:border-brand-700">
              <RiArchiveLine className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button variant="outline" size="sm" className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400">
              <RiDeleteBin7Line className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            Showing {totalProjects} project{totalProjects !== 1 ? 's' : ''}
          </span>
          {searchParams.get('search') && (
            <Badge variant="outline" className="text-xs">
              Search: {searchParams.get('search')}
            </Badge>
          )}
          {searchParams.get('status') && searchParams.get('status') !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Status: {searchParams.get('status')}
            </Badge>
          )}
          {searchParams.get('sort') && searchParams.get('sort') !== 'newest' && (
            <Badge variant="outline" className="text-xs">
              Sort: {searchParams.get('sort')}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="text-xs"
          >
            <RiMoreLine className="w-4 h-4 mr-1" />
            More Actions
          </Button>
        </div>
      </div>
    </div>
  );
}