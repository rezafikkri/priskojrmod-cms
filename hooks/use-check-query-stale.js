import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Returns a function that checks whether a TanStack Query cached data is considered stale.
 * Returns true if the query has never been fetched (!queryState) or
 * if the data has exceeded the staleTime.
 */
export function useCheckQueryStale() {
  const queryClient = useQueryClient();

  return useCallback((queryKey, staleTime) => {
    const queryState = queryClient.getQueryState(queryKey);
    return !queryState ||
      queryState.isInvalidated ||
      Date.now() - queryState.dataUpdatedAt >= staleTime;
  }, []);
}
