'use client';

import { cn, getNotFoundImagePath } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function FormImagePreview({
  className,
  orientation = 'square',
  src = '',
  alt = 'Picture',
}) {
  const { theme } = useTheme();
  const [ mounted, setMounted ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('rounded-md border size-40 bg-zinc-100 dark:bg-zinc-900/50', className)} />
    );
  }

  return (
    <div className={cn('rounded-md border size-40 bg-zinc-100 dark:bg-zinc-900/50', className)}>
      <img
        src={src === '' ? getNotFoundImagePath(theme, orientation) : src}
        alt={alt}
        className="w-full h-full rounded-md object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
