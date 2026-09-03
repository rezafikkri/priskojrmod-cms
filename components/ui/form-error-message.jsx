import { cn } from '@/lib/utils';

export function FormErrorMessage({ children, className }) {
  return (
    <p className={cn('text-destructive dark:text-red-500/85 text-sm', className)}>
      {children}
    </p>
  );
}
