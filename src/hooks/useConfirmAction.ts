'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseConfirmActionOptions {
  onSuccess?: () => void;
  redirectTo?: string;
  refreshOnSuccess?: boolean;
}

interface UseConfirmActionReturn<T> {
  isLoading: boolean;
  error: string | null;
  executeAction: (action: () => Promise<T>) => Promise<T>;
  clearError: () => void;
}

/**
 * Generic hook for handling confirm actions with error handling and navigation
 */
export function useConfirmAction<T = any>(
  options: UseConfirmActionOptions = {}
): UseConfirmActionReturn<T> {
  const { onSuccess, redirectTo, refreshOnSuccess = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const executeAction = async (action: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await action();

      // Handle success
      if (onSuccess) {
        onSuccess();
      }

      if (redirectTo) {
        router.push(redirectTo);
      }

      if (refreshOnSuccess) {
        router.refresh();
      }

      return result;
    } catch (actionError) {
      const errorMessage = actionError instanceof Error
        ? actionError.message
        : 'An unexpected error occurred';

      setError(errorMessage);
      throw actionError; // Re-throw so ConfirmDialog knows it failed
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    error,
    executeAction,
    clearError,
  };
}