'use client';

import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableErrorAlert({ isError, message }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isError) {
      setShouldRender(true);
    }
  }, [isError]);

  const handleAnimationEnd = () => {
    if (!isError) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <Alert
      variant="destructive"
      className="text-base mb-4 relative [&>svg]:translate-y-1 border-destructive/50 data-[visible=true]:animate-in data-[visible=false]:animate-out fade-in fade-out duration-150 fill-mode-forwards"
      data-visible={isError}
      onAnimationEnd={handleAnimationEnd}
    >
      <AlertCircle />
      <AlertTitle className="pr-7 line-clamp-0">{message}</AlertTitle>
    </Alert>
  );
}
