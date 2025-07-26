import { useEffect, useState } from 'react';

export function useDebounce(value) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return debouncedValue;
}
