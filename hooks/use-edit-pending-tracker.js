import { useState } from 'react';

// This is number counter for track async process like delete variant, etc. (for edit mode only)
export default function useEditPendingTracker() {
  const [pendingCount, setPendingCount] = useState(0);
  const incrementPending = () => setPendingCount(prev => prev + 1);
  const decrementPending = () => setPendingCount(prev => (prev > 1) ? --prev : 0);
  const isBlocking = pendingCount > 0;

  return {
    pendingCount,
    incrementPending,
    decrementPending,
    isBlocking,
  };
}
