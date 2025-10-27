import { Skeleton } from '../ui/skeleton';

export default function InfoSectionSkeleton() {
  return (
    <div className="space-y-4 mt-3">
      <div className="space-y-1.5">
        <Skeleton className="w-1/4 flex-auto h-[24px] rounded-sm" />
        <Skeleton className="w-1/2 flex-auto h-[24px] rounded-sm" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-3/4 flex-auto h-[36px] rounded-md" />
        <Skeleton className="w-1/3 flex-auto h-[36px] rounded-md" />
      </div>

      <div className="space-y-2">
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
