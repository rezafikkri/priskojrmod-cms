'use client';

import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableErrorAlert({ isError, isRefetching, message }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isRefetching && isError) {
      setShouldRender(true);
    }

    if (!isError && shouldRender) {
      setIsDismissed(true);
    }
  }, [isError, isRefetching]);

  const handleAnimationEnd = () => {
    if (isDismissed) {
      setShouldRender(false);
      setIsDismissed(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <Alert
      variant="destructive"
      className="text-base mb-4 relative [&>svg]:translate-y-1 border-destructive/50 data-[visible=true]:animate-in data-[visible=false]:animate-out fade-in fade-out duration-150 fill-mode-forwards"
      data-visible={isError && !isDismissed}
      onAnimationEnd={handleAnimationEnd}
    >
      <AlertCircle />
      <AlertTitle className="pr-7 line-clamp-0">{message}</AlertTitle>
      <button
        className="absolute right-4 top-3 translate-y-1"
        onClick={() => setIsDismissed(true)}
      >
        <X className="size-4 text-red-600 opacity-50 hover:opacity-100 duration-150" />
      </button>
    </Alert>
  );
}
