'use client';

import { useState, useEffect, useRef } from 'react';
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
  RiCloseLine
} from '@remixicon/react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'actions' | 'projects' | 'resources';
}

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Base commands that are always available
  const baseCommands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Go to organisations',
      icon: RiProjectorLine,
      action: () => {
        router.push('/orga/organisations');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'projects',
      title: 'Projects',
      subtitle: 'View all projects',
      icon: RiProjectorLine,
      action: () => {
        router.push('/main/projects');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'resources',
      title: 'Resources',
      subtitle: 'View all resources',
      icon: RiServerLine,
      action: () => {
        router.push('/main/resources');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'teams',
      title: 'Teams',
      subtitle: 'View all teams',
      icon: RiTeamLine,
      action: () => {
        router.push('/main/teams');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View your profile',
      icon: RiUserLine,
      action: () => {
        router.push('/main/profile');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Application settings',
      icon: RiSettings3Line,
      action: () => {
        router.push('/main/settings');
        close();
      },
      category: 'navigation'
    },
    {
      id: 'new-project',
      title: 'New Project',
      subtitle: 'Create a new project',
      icon: RiAddLine,
      action: () => {
        router.push('/main/projects/new');
        close();
      },
      category: 'actions'
    },
    {
      id: 'new-resource',
      title: 'New Resource',
      subtitle: 'Create a new resource',
      icon: RiDatabase2Line,
      action: () => {
        router.push('/main/resources/new');
        close();
      },
      category: 'actions'
    }
  ];

  const [commands] = useState<CommandItem[]>(baseCommands);

  // Filter commands based on query
  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    projects: 'Projects',
    resources: 'Resources'
  };

  let currentIndex = 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-full max-w-xl p-0 mt-16">
        <DialogTitle className="sr-only">
          Command Palette
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          <RiSearchLine className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for commands, projects, resources..."
            className="flex-1 border-0 bg-transparent py-4 px-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
          />
          <button
            onClick={close}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </div>
                {categoryCommands.map((command) => {
                  const isSelected = currentIndex === selectedIndex;
                  const itemIndex = currentIndex++;

                  return (
                    <button
                      key={command.id}
                      onClick={command.action}
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
                        <command.icon className={`h-4 w-4 ${
                          isSelected
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isSelected
                            ? 'text-brand-900 dark:text-brand-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {command.title}
                        </div>
                        {command.subtitle && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {command.subtitle}
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