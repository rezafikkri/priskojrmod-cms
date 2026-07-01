import { Skeleton } from '../ui/skeleton';

export default function PartiesSectionSkeleton() {
  return (
    <div className="space-y-3 mt-2.5">
      <div className="space-y-2">
        <Skeleton className="w-1/3 flex-auto h-[24px] rounded-sm" />
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="w-1/4 flex-auto h-[24px] rounded-sm" />
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[30px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[30px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
