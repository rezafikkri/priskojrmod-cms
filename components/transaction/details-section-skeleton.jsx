import { Skeleton } from '../ui/skeleton';

export default function DetailsSectionSkeleton() {
  return (
    <div className="space-y-3 mt-2.5">
      <div className="space-y-2">
        <Skeleton className="w-1/2 flex-auto h-[24px] rounded-sm" />
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
      </div>

      <Skeleton className="w-1/2 flex-auto h-[24px] rounded-sm" />
      <div className="space-y-2">
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
