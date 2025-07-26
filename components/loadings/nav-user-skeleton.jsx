import { Skeleton } from '@/components/ui/skeleton';

export default function NavUserSkeleton() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="size-8 rounded-full bg-[#EBEBED] dark:bg-accent" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4.5 w-full rounded-md bg-[#EBEBED] dark:bg-accent" />
        <Skeleton className="h-4 w-1/2 rounded-md bg-[#EBEBED] dark:bg-accent" />
      </div>
    </div>
  );
}
