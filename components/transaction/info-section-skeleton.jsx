import { Skeleton } from '../ui/skeleton';

export default function InfoSectionSkeleton() {
  return (
    <div className="space-y-4 mt-3">
      <div className="space-y-1.5">
        <Skeleton className="w-1/4 h-[24px] rounded-sm" />
        <Skeleton className="w-1/2 h-[24px] rounded-sm" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-3/4 h-[36px] rounded-md" />
        <Skeleton className="w-1/3 h-[36px] rounded-md" />
      </div>
    </div>
  );
}
