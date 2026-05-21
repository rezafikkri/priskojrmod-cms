'use client';

import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableErrorAlert({ isError, message, isSilent = false }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isError && !isSilent) {
      setShouldRender(true);
    }
  }, [isError, isSilent]);

  const handleAnimationEnd = () => {
    if (!isError) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <Alert
      variant="destructive"
      className="text-base mb-4 relative border-destructive/50 data-[visible=true]:animate-in data-[visible=false]:animate-out fade-in fade-out duration-150 fill-mode-forwards items-baseline"
      data-visible={isError}
      onAnimationEnd={handleAnimationEnd}
    >
      <AlertCircle />
      <AlertTitle className="line-clamp-0">{message}</AlertTitle>
    </Alert>
  );
}
