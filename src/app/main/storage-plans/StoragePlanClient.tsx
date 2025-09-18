'use client';

import { useState, useActionState } from 'react';
import StorageTierSelector, { StorageTier } from '@/components/form/StorageTierSelector';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { updateUserStorageTier } from '@/actions/storage';

interface StoragePlanClientProps {
  currentTier: StorageTier;
  userId: string;
}

export default function StoragePlanClient({ currentTier, userId }: StoragePlanClientProps) {
  const [selectedTier, setSelectedTier] = useState<StorageTier>(currentTier);
  const [state, formAction, isPending] = useActionState(updateUserStorageTier, null);

  const formActionWithTier = async (formData: FormData) => {
    formData.set('storageTier', selectedTier);
    formData.set('userId', userId);
    return formAction(formData);
  };

  return (
    <div>
      {state?.error && (
        <Callout variant="error" title="Error" className="mb-6">
          {state.error}
        </Callout>
      )}
      {state?.success && (
        <Callout variant="success" title="Success" className="mb-6">
          Your storage plan has been updated successfully!
        </Callout>
      )}

      <form action={formActionWithTier}>
        <StorageTierSelector
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          disabled={isPending}
        />

        <div className="mt-8 text-center">
          <Button
            type="submit"
            className="px-8 py-3 text-lg"
            isLoading={isPending}
            disabled={selectedTier === currentTier}
          >
            {selectedTier === currentTier ? 'Current Plan' : 'Update Storage Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}