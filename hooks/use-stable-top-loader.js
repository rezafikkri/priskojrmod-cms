import { useEffect, useCallback, useRef } from 'react';
import { useTopLoader } from 'nextjs-toploader';

export function useStableTopLoader() {
  const loader = useTopLoader();
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const start = useCallback(() => loaderRef.current.start(), []);
  const done = useCallback(() => loaderRef.current.done(), []);

  return { start, done };
}
