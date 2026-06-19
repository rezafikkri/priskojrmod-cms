import { Skeleton } from '@/components/ui/skeleton';
import TableSkeleton from './table-skeleton';

export default function TablePaginationSkeleton() {
  return (
    <>
      <TableSkeleton />
      <div className="flex justify-between items-center gap-5 mt-4">
        <Skeleton className="w-20 h-[27px] rounded-md" />
          <div className="gap-2 flex">
            <Skeleton className="w-20 h-[35px] rounded-md" />
            <Skeleton className="w-20 h-[35px] rounded-md" />
          </div>
      </div>
    </>
  );
}
