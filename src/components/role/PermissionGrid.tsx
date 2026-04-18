'use client';

import type { ProjectPermission } from '@/lib/store';
import { Badge } from '@/components/common/Badge';

export const PERMISSION_LABELS: Record<ProjectPermission, string> = {
  'project:view': 'View project',
  'project:settings': 'Manage settings',
  'resource:view': 'View resources',
  'resource:create': 'Create resources',
  'resource:edit': 'Edit resources',
  'resource:delete': 'Delete resources',
  'resource:deploy': 'Deploy resources',
  'access:view': 'View access',
  'access:manage': 'Manage access',
};

export const PERMISSION_GROUPS: Record<string, ProjectPermission[]> = {
  Project: ['project:view', 'project:settings'],
  Resources: ['resource:view', 'resource:create', 'resource:edit', 'resource:delete', 'resource:deploy'],
  Access: ['access:view', 'access:manage'],
};

interface PermissionGridReadOnlyProps {
  permissions: ProjectPermission[];
  readOnly: true;
  onChange?: never;
}

interface PermissionGridEditableProps {
  permissions: ProjectPermission[];
  readOnly?: false;
  onChange: (permissions: ProjectPermission[]) => void;
}

type PermissionGridProps = PermissionGridReadOnlyProps | PermissionGridEditableProps;

export function PermissionGrid({ permissions, readOnly, onChange }: PermissionGridProps) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {permissions.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500">No permissions</span>
        ) : (
          permissions.map((p) => (
            <Badge key={p} variant="default">
              {PERMISSION_LABELS[p]}
            </Badge>
          ))
        )}
      </div>
    );
  }

  const handleToggle = (perm: ProjectPermission) => {
    if (!onChange) return;
    if (permissions.includes(perm)) {
      onChange(permissions.filter((p) => p !== perm));
    } else {
      onChange([...permissions, perm]);
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <div key={group}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {group}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perms.map((perm) => {
              const checked = permissions.includes(perm);
              return (
                <label
                  key={perm}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    name={`perm_${perm}`}
                    value="on"
                    checked={checked}
                    onChange={() => handleToggle(perm)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {PERMISSION_LABELS[perm]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
