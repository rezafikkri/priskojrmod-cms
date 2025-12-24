import AdminsTable from '@/components/admin/admins-table';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import TablePaginationSkeleton from '@/components/loadings/table-pagination-skeleton';

export const metadata = {
  title: 'Admins',
};

export default function AdminListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Admins</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">List of admins with the staff role.</h2>

      <TooltipWrapper text="Create admin">
        <Button asChild variant="outline" className="mb-5 h-auto inline-block text-base px-3 py-1.5">
          <Link href="/admin/new"><Plus className="icon" /> Create</Link>
        </Button>
      </TooltipWrapper>

      <Suspense fallback={<TablePaginationSkeleton showPagination={false} />}>
        <AdminsTable />
      </Suspense>
    </>
  );
}
