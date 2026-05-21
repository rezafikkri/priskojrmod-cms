'use client';

import {
  Alert,
  AlertTitle,
} from './alert';
import Error404 from '../icon/error-404';
import { cn } from '@/lib/utils';

export default function NotFoundAlert({ message, className }) {
  return (
    <Alert className={cn('text-base items-baseline', className)}>
      <Error404 />
      <AlertTitle className="line-clamp-0">{message}</AlertTitle>
    </Alert>
  );
}
