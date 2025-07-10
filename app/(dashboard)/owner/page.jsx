import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Plus } from 'lucide-react';
import { Suspense } from 'react';
import TableSekeleton from '@/components/loadings/table-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import OwnersTable from '@/components/owner/owners-table';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Owners',
};

export default function OwnerListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Owners</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">Official ownership data of digital products sold on the website.</h2>

      <TooltipWrapper text="Create owner">
        <Button asChild variant="outline" className="mb-5 h-auto inline-block text-base px-3 py-1.5">
          <Link href="/owner/new"><Plus className="icon" /> Create</Link>
        </Button>
      </TooltipWrapper>

      <Suspense fallback={<TableSekeleton />}>
        <OwnersTable />
      </Suspense>
    </>
  );
}
