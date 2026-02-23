import { useCallback, useState } from 'react';

export function useDialog() {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((data) => {
    setIsOpen(true);
    setData(data);
  }, []);

  function close() {
    setIsOpen(false);
  }

  return { data, isOpen, open, close };
}
