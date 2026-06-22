import { cn } from '@/lib/utils';

export default function TableTwoLineCell({ primary, secondary, secondaryClassName }) {
  return (
    <div className="flex flex-col">
      <span>{primary}</span>
      <span
        className={cn('text-sm text-muted-foreground', secondaryClassName)}
      >
          {secondary}
      </span>
    </div>
  );
}
