'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import StorageTierSelector, { StorageTier } from '@/components/form/StorageTierSelector';
import { createTeamStorage, updateTeamStorage, deleteTeamStorage } from '@/actions/team-storage';
import { RiDeleteBinLine, RiEditLine } from '@remixicon/react';

interface TeamStorageResource {
  id: string;
  name: string;
  description?: string;
  tier: StorageTier;
  totalBytes: bigint;
  usedBytes: bigint;
  isActive: boolean;
  team: {
    name: string;
  };
  purchaser: {
    name?: string;
    firstname?: string;
    lastname?: string;
    email: string;
  };
}

interface TeamStorageFormProps {
  teamId: string;
  teamName: string;
  canManage: boolean;
  storage?: TeamStorageResource | null;
}

export default function TeamStorageForm({
  teamId,
  teamName,
  canManage,
  storage
}: TeamStorageFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StorageTier>(storage?.tier || 'BASIC_5GB');

  const action = storage ? updateTeamStorage : createTeamStorage;
  const [state, formAction, isPending] = useActionState(action, null);

  const formActionWithData = async (formData: FormData) => {
    formData.set('teamId', teamId);
    formData.set('storageTier', selectedTier);
    const result = await formAction(formData);
    if (result?.success) {
      setIsEditing(false);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this storage resource? This action cannot be undone.')) {
      return;
    }

    const result = await deleteTeamStorage(teamId);
    if (!result.success) {
      alert(result.error || 'Failed to delete storage');
    }
  };

  const formatBytes = (bytes: bigint) => {
    const gb = Number(bytes) / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(Number(bytes) / (1024 ** 2)).toFixed(0)} MB`;
  };

  const getUsagePercentage = () => {
    if (!storage) return 0;
    return (Number(storage.usedBytes) / Number(storage.totalBytes)) * 100;
  };

  const getPurchaserName = (purchaser: TeamStorageResource['purchaser']) => {
    if (purchaser.name) return purchaser.name;
    if (purchaser.firstname && purchaser.lastname) return `${purchaser.firstname} ${purchaser.lastname}`;
    if (purchaser.firstname) return purchaser.firstname;
    return purchaser.email;
  };

  if (!canManage && !storage) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Only team owners and leads can manage storage resources.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Storage Display */}
      {storage && !isEditing && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Storage
            </h3>
            {canManage && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isPending}
                >
                  <RiEditLine className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <RiDeleteBinLine className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{storage.name}</h4>
              {storage.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{storage.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="default">
                {storage.tier.replace('_', ' ').replace('GB', ' GB').replace('MB', ' MB')}
              </Badge>
              <Badge variant={storage.isActive ? "success" : "destructive"}>
                {storage.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Storage Usage</span>
                <span className="font-medium">
                  {formatBytes(storage.usedBytes)} / {formatBytes(storage.totalBytes)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getUsagePercentage().toFixed(1)}% used
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Purchased by: <span className="font-medium">{getPurchaserName(storage.purchaser)}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Storage Form */}
      {(!storage || isEditing) && canManage && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {storage ? 'Update Storage' : 'Purchase Team Storage'}
            </h3>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>

          {state?.error && (
            <Callout variant="error" title="Error" className="mb-6">
              {state.error}
            </Callout>
          )}
          {state?.success && (
            <Callout variant="success" title="Success" className="mb-6">
              {storage ? 'Storage updated successfully!' : 'Team storage created successfully!'}
            </Callout>
          )}

          <form action={formActionWithData} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Storage Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={storage?.name || `${teamName} Storage`}
                  placeholder="e.g., Development Team Storage"
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={storage?.description || ''}
                  placeholder="Brief description of this storage resource"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <StorageTierSelector
                selectedTier={selectedTier}
                onTierChange={setSelectedTier}
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="px-6 py-2"
                isLoading={isPending}
              >
                {storage ? 'Update Storage' : 'Purchase Storage'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* No Storage Message */}
      {!storage && !canManage && (
        <Card className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            This team doesn't have a storage resource yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Team owners or leads can purchase storage for the team.
          </p>
        </Card>
      )}
    </div>
  );
}