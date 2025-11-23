// Custom hook for optimistic UI updates
// Updates UI immediately, then syncs with Firebase in background

import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error, rollbackData: T) => void;
}

export function useOptimisticUpdate<T>(
    initialData: T,
    options?: OptimisticUpdateOptions<T>
) {
    const [data, setData] = useState<T>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Perform optimistic update
     * @param optimisticData - Data to display immediately
     * @param updateFn - Async function to sync with backend
     */
    const update = useCallback(
        async (
            optimisticData: T,
            updateFn: () => Promise<T>
        ) => {
            const previousData = data;

            // Immediately update UI
            setData(optimisticData);
            setIsLoading(true);
            setError(null);

            try {
                // Sync with backend
                const result = await updateFn();
                setData(result);
                setIsLoading(false);

                if (options?.onSuccess) {
                    options.onSuccess(result);
                }

                return result;
            } catch (err) {
                // Rollback on error
                const error = err instanceof Error ? err : new Error('Update failed');
                setData(previousData);
                setError(error);
                setIsLoading(false);

                if (options?.onError) {
                    options.onError(error, previousData);
                }

                throw error;
            }
        },
        [data, options]
    );

    return {
        data,
        setData,
        isLoading,
        error,
        update
    };
}
