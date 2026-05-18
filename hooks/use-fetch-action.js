import { useState, useCallback, useRef } from 'react';

// Introduced to support silent-error handling for data-table
// refetches triggered by invalidateQueries after successful
// table actions. Keeps fetchAction state and ref synchronized
// so queryFn can always access the latest value.
export function useFetchAction(initialValue = null) {
  const [fetchAction, setFetchAction] = useState(initialValue);
  const fetchActionRef = useRef(initialValue);

  const updateFetchAction = useCallback((nextValue) => {
    setFetchAction(nextValue);
    fetchActionRef.current = nextValue;
  }, []);

  return { fetchAction, fetchActionRef, updateFetchAction };
}
