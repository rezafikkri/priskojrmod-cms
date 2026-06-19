import { Skeleton } from '@/components/ui/skeleton';

export default function TableSkeleton() {
  return (
    <div className="rounded-md border relative p-3">
      <div className="flex space-x-3 mb-4">
        <Skeleton className="w-20 flex-auto h-[35px] rounded-md" />
        <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
        <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex space-x-3 mt-3" key={i}>
          <Skeleton className="w-20 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-50 flex-auto h-[40px] rounded-md" />
        </div>
      ))}
    </div>
  );
}
