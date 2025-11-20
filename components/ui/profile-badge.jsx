'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ProfileBadge({ src, className, fallbackText }) {
  const [isError, setIsError] = useState(false); 

  return (
    <div className={cn('rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 overflow-hidden size-7.5 flex items-center justify-center', className)}>
      {(!isError || !src) ? (
        <img
          src={src}
          alt={fallbackText}
          loading="lazy"
          decoding="async"
          onError={() => setIsError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-zinc-600 dark:text-zinc-400">{fallbackText.charAt(0)}</span>
      )}
    </div>
  );
}
