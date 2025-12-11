import { deepEqual } from 'fast-equals';
import { useState, useEffect } from 'react';
import { localStorageGet } from '@/lib/local-storage';

export default function useColumnVisibility(defaultColumnVisibility) {
  const [columnVisibility, setColumnVisibility] = useState(() => 
    localStorageGet('products:column-visibility') ?? defaultColumnVisibility
  );

  useEffect(() => {
    const savedColumnVisibility = localStorageGet('products:column-visibility');
    if (savedColumnVisibility && !deepEqual(defaultColumnVisibility, savedColumnVisibility)) {
      setColumnVisibility(savedColumnVisibility);
    }
  }, []);

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
