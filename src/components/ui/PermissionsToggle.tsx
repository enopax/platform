'use client';

import { useState } from 'react';
import { Badge } from '@/components/common/Badge';

interface PermissionsToggleProps {
  userId: string;
  teamId: string;
  initialPermissions: {
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
    canLead: boolean;
  };
  onPermissionChange: (userId: string, teamId: string, permissions: {
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
    canLead: boolean;
  }) => Promise<void>;
  disabled?: boolean;
}

type PermissionLevel = 'none' | 'r' | 'rw' | 'rwx' | 'lead';

export default function PermissionsToggle({
  userId,
  teamId,
  initialPermissions,
  onPermissionChange,
  disabled = false
}: PermissionsToggleProps) {
  // Convert initial permissions to permission level
  const getPermissionLevel = (perms: typeof initialPermissions): PermissionLevel => {
    if (perms.canLead) return 'lead';
    if (perms.canExecute) return 'rwx';
    if (perms.canWrite) return 'rw';
    if (perms.canRead) return 'r';
    return 'none';
  };

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>(
    getPermissionLevel(initialPermissions)
  );
  const [updating, setUpdating] = useState(false);

  const getPermissionsFromLevel = (level: PermissionLevel) => {
    switch (level) {
      case 'none':
        return { canRead: false, canWrite: false, canExecute: false, canLead: false };
      case 'r':
        return { canRead: true, canWrite: false, canExecute: false, canLead: false };
      case 'rw':
        return { canRead: true, canWrite: true, canExecute: false, canLead: false };
      case 'rwx':
        return { canRead: true, canWrite: true, canExecute: true, canLead: false };
      case 'lead':
        return { canRead: true, canWrite: true, canExecute: true, canLead: true };
      default:
        return { canRead: false, canWrite: false, canExecute: false, canLead: false };
    }
  };

  const getNextLevel = (current: PermissionLevel): PermissionLevel => {
    const levels: PermissionLevel[] = ['r', 'rw', 'rwx', 'lead'];
    const currentIndex = levels.indexOf(current);
    return levels[(currentIndex + 1) % levels.length];
  };

  const getBadgeVariant = (level: PermissionLevel) => {
    switch (level) {
      case 'r': return 'default';
      case 'rw': return 'secondary';
      case 'rwx': return 'default';
      case 'lead': return 'default';
      default: return 'outline';
    }
  };

  const getBadgeStyles = (level: PermissionLevel) => {
    switch (level) {
      case 'r':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rw':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rwx':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'lead':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'text-gray-600 border-gray-300';
    }
  };

  const getTooltipText = (level: PermissionLevel) => {
    switch (level) {
      case 'r': return 'Read only - can view team resources';
      case 'rw': return 'Read/Write - can view and modify team resources';
      case 'rwx': return 'Read/Write/Execute - can view, modify, and use team resources';
      case 'lead': return 'Lead - full permissions including team management';
      default: return 'No permissions';
    }
  };

  const handleClick = async () => {
    if (disabled || updating) return;

    const nextLevel = getNextLevel(permissionLevel);
    const newPermissions = getPermissionsFromLevel(nextLevel);

    setUpdating(true);
    try {
      await onPermissionChange(userId, teamId, newPermissions);
      setPermissionLevel(nextLevel);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Badge
      variant={getBadgeVariant(permissionLevel)}
      className={`cursor-pointer select-none transition-colors text-xs min-w-[40px] h-6 flex items-center justify-center ${
        disabled || updating ? 'cursor-not-allowed opacity-50' : 'hover:bg-opacity-80'
      } ${getBadgeStyles(permissionLevel)}`}
      onClick={handleClick}
      title={getTooltipText(permissionLevel)}
    >
      {permissionLevel}
    </Badge>
  );
}