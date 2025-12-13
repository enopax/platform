'use client';

import { useState, useEffect, useRef, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { Dialog, DialogContent, DialogTitle } from '@/components/common/Dialog';
import {
  RiSearchLine,
  RiProjectorLine,
  RiTeamLine,
  RiUserLine,
  RiSettings3Line,
  RiDatabase2Line,
  RiServerLine,
  RiAddLine,
  RiArrowRightLine,
  RiCloseLine,
  RiArrowLeftLine,
  RiFolderLine,
  RiGitRepositoryLine
} from '@remixicon/react';
import {
  getUserOrganisations,
  getOrganisationProjects,
  getProjectResources,
  type CommandPaletteOrganisation,
  type CommandPaletteProject,
  type CommandPaletteResource
} from '@/actions/command-palette';

interface BaseCommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'actions';
  type: 'command';
}

interface OrganisationItem extends CommandPaletteOrganisation {
  type: 'organisation';
  category: 'organisation';
}

interface ProjectItem extends CommandPaletteProject {
  type: 'project';
  category: 'project';
}

interface ResourceItem extends CommandPaletteResource {
  type: 'resource';
  category: 'resource';
}

type CommandItem = BaseCommandItem | OrganisationItem | ProjectItem | ResourceItem;
type NavigationLevel = 'root' | 'organisations' | 'projects' | 'resources';

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('root');
  const [selectedOrganisation, setSelectedOrganisation] = useState<CommandPaletteOrganisation | null>(null);
  const [selectedProject, setSelectedProject] = useState<CommandPaletteProject | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Base static commands
  const baseCommands: BaseCommandItem[] = [
    {
      id: 'organisations',
      title: 'Organisations',
      subtitle: 'Browse all organisations',
      icon: RiProjectorLine,
      action: () => {
        router.push('/orga');
        close();
      },
      category: 'navigation',
      type: 'command'
    },
    {
      id: 'settings',
      title: 'Account Settings',
      subtitle: 'Manage your account',
      icon: RiSettings3Line,
      action: () => {
        router.push('/account/settings');
        close();
      },
      category: 'navigation',
      type: 'command'
    },
    {
      id: 'developer',
      title: 'Developer',
      subtitle: 'Developer tools and API keys',
      icon: RiGitRepositoryLine,
      action: () => {
        router.push('/account/developer');
        close();
      },
      category: 'navigation',
      type: 'command'
    }
  ];

  // Dynamically loaded data
  const [organisations, setOrganisations] = useState<OrganisationItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Fetch organisations when palette opens and user is on root level
  useEffect(() => {
    if (isOpen && currentLevel === 'root' && organisations.length === 0) {
      const fetchOrgs = async () => {
        setLoading(true);
        try {
          const orgs = await getUserOrganisations();
          setOrganisations(orgs.map(org => ({ ...org, type: 'organisation', category: 'organisation' as const })));
        } finally {
          setLoading(false);
        }
      };
      fetchOrgs();
    }
  }, [isOpen, currentLevel, organisations.length]);

  // Fetch projects when organisation is selected
  useEffect(() => {
    if (currentLevel === 'projects' && selectedOrganisation) {
      const fetchProjects = async () => {
        setLoading(true);
        try {
          const projs = await getOrganisationProjects(selectedOrganisation.id);
          setProjects(projs.map(proj => ({ ...proj, type: 'project', category: 'project' as const })));
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [currentLevel, selectedOrganisation]);

  // Fetch resources when project is selected
  useEffect(() => {
    if (currentLevel === 'resources' && selectedProject) {
      const fetchResourcesList = async () => {
        setLoading(true);
        try {
          const res = await getProjectResources(selectedProject.id);
          setResources(res.map(r => ({ ...r, type: 'resource', category: 'resource' as const })));
        } finally {
          setLoading(false);
        }
      };
      fetchResourcesList();
    }
  }, [currentLevel, selectedProject]);

  // Get current items to display
  const getCurrentItems = (): CommandItem[] => {
    let items: CommandItem[] = [];

    if (currentLevel === 'root') {
      // Show base commands + organisations
      items = [...baseCommands, ...organisations];
    } else if (currentLevel === 'projects') {
      items = projects;
    } else if (currentLevel === 'resources') {
      items = resources;
    }

    return items;
  };

  const currentItems = getCurrentItems();

  // Filter items based on query
  const filteredItems = currentItems.filter(item => {
    if (item.type === 'command') {
      return item.title.toLowerCase().includes(query.toLowerCase()) ||
             item.subtitle?.toLowerCase().includes(query.toLowerCase());
    }
    return item.name.toLowerCase().includes(query.toLowerCase());
  });

  // Reset selection when query or level changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, currentLevel]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowLeft' && currentLevel !== 'root') {
        // Go back to previous level
        e.preventDefault();
        if (currentLevel === 'projects') {
          setCurrentLevel('root');
          setSelectedOrganisation(null);
          setProjects([]);
          setQuery('');
        } else if (currentLevel === 'resources') {
          setCurrentLevel('projects');
          setSelectedProject(null);
          setResources([]);
          setQuery('');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (!selected) return;

        if (selected.type === 'command') {
          selected.action();
        } else if (selected.type === 'organisation') {
          setSelectedOrganisation(selected);
          setCurrentLevel('projects');
          setQuery('');
        } else if (selected.type === 'project') {
          setSelectedProject(selected);
          setCurrentLevel('resources');
          setQuery('');
        } else if (selected.type === 'resource') {
          // Navigate to resource
          router.push(`/orga/${selected.organisationName}/${selected.projectName}/${selected.name}`);
          close();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, currentLevel, router, close]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    organisation: 'Organisations',
    project: 'Projects',
    resource: 'Resources'
  };

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  let currentIndex = 0;

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const parts = [];
    if (selectedOrganisation) {
      parts.push(selectedOrganisation.name);
    }
    if (selectedProject) {
      parts.push(selectedProject.name);
    }
    return parts.length > 0 ? parts.join(' > ') : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-full max-w-xl p-0 mt-16">
        <DialogTitle className="sr-only">
          Command Palette
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          {currentLevel !== 'root' && (
            <button
              onClick={() => {
                if (currentLevel === 'projects') {
                  setCurrentLevel('root');
                  setSelectedOrganisation(null);
                  setProjects([]);
                } else if (currentLevel === 'resources') {
                  setCurrentLevel('projects');
                  setSelectedProject(null);
                  setResources([]);
                }
                setQuery('');
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Go back"
            >
              <RiArrowLeftLine className="h-5 w-5" />
            </button>
          )}
          <RiSearchLine className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              currentLevel === 'root' ? 'Search commands, organisations...' :
              currentLevel === 'projects' ? 'Search projects...' :
              'Search resources...'
            }
            className="flex-1 border-0 bg-transparent py-4 px-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
          />
          <button
            onClick={close}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        {getBreadcrumb() && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            {getBreadcrumb()}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {query ? `No results found for "${query}"` : 'No items available'}
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {categoryLabels[category] || category}
                </div>
                {categoryItems.map((item) => {
                  const isSelected = currentIndex === selectedIndex;
                  const itemIndex = currentIndex++;

                  let title = '';
                  let subtitle = '';
                  let icon: React.ComponentType<{ className?: string }> = RiProjectorLine;

                  if (item.type === 'command') {
                    title = item.title;
                    subtitle = item.subtitle || '';
                    icon = item.icon;
                  } else if (item.type === 'organisation') {
                    title = item.name;
                    icon = RiFolderLine;
                  } else if (item.type === 'project') {
                    title = item.name;
                    icon = RiGitRepositoryLine;
                  } else if (item.type === 'resource') {
                    title = item.name;
                    subtitle = item.type;
                    icon = RiDatabase2Line;
                  }

                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        if (item.type === 'command') {
                          item.action();
                        } else if (item.type === 'organisation') {
                          setSelectedOrganisation(item);
                          setCurrentLevel('projects');
                          setQuery('');
                        } else if (item.type === 'project') {
                          setSelectedProject(item);
                          setCurrentLevel('resources');
                          setQuery('');
                        } else if (item.type === 'resource') {
                          router.push(`/orga/${item.organisationName}/${item.projectName}/${item.name}`);
                          close();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 p-2 rounded-lg ${
                        isSelected
                          ? 'bg-brand-100 dark:bg-brand-800'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {icon && createElement(icon, {
                          className: `h-4 w-4 ${
                            isSelected
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isSelected
                            ? 'text-brand-900 dark:text-brand-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {title}
                        </div>
                        {subtitle && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <RiArrowRightLine className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded ml-1">↓</kbd>
              {' '}to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              {' '}to select
            </span>
            {currentLevel !== 'root' && (
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">←</kbd>
                {' '}to go back
              </span>
            )}
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
              {' '}to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}