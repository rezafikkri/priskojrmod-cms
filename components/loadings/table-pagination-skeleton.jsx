import { Skeleton } from '@/components/ui/skeleton';

export default function TablePaginationSekeleton({
  showPagination = true,
}) {
  return (
    <>
      <div className="rounded-md border relative p-3">
        <div className="flex space-x-3">
          <Skeleton className="w-20 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[35px] rounded-md" />
          <Skeleton className="w-50 flex-auto h-[35px] rounded-md" />
        </div>

        <div className="flex space-x-3 mt-4">
          <Skeleton className="w-20 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-50 flex-auto h-[40px] rounded-md" />
        </div>
        <div className="flex space-x-3 mt-3">
          <Skeleton className="w-20 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-50 flex-auto h-[40px] rounded-md" />
        </div>
        <div className="flex space-x-3 mt-3">
          <Skeleton className="w-20 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-70 flex-auto h-[40px] rounded-md" />
          <Skeleton className="w-50 flex-auto h-[40px] rounded-md" />
        </div>
      </div>

      <div className="flex justify-between items-center gap-5 mt-4">
        <Skeleton className="w-20 h-[27px] rounded-md" />
        {showPagination ? (
          <div className="gap-2 flex">
            <Skeleton className="w-20 h-[35px] rounded-md" />
            <Skeleton className="w-20 h-[35px] rounded-md" />
          </div>
        ) : null}
      </div>
    </>
  );
}
