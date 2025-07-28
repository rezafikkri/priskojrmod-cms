import { Skeleton } from '../ui/skeleton';

export default function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="w-1/4 flex-auto h-[14px] rounded-sm" />
        <Skeleton className="w-full flex-auto h-[36px] rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-1/3 flex-auto h-[14px] rounded-sm" />
        <Skeleton className="w-full flex-auto h-[36px] rounded-md" />
        <Skeleton className="w-2/7 flex-auto h-[14px] rounded-sm" />
      </div>
    </div>
  );
}
