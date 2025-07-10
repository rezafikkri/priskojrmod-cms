import CategoriesTable from '@/components/category/categories-table';
import TableSekeleton from '@/components/loadings/table-skeleton';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Categories',
};

export default function CategoryListPage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Categories</h1>

      <TooltipWrapper text="Create category">
        <Button asChild variant="outline" className="mb-5 h-auto inline-block text-base px-3 py-1.5">
          <Link href="/category/new"><Plus className="icon" /> Create</Link>
        </Button>
      </TooltipWrapper>

      <Suspense fallback={<TableSekeleton />}>
        <CategoriesTable />
      </Suspense>
    </>
  );
}
