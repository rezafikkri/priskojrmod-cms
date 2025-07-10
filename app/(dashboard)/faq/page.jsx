import FaqsTable from '@/components/faq/faqs-table';
import TableSekeleton from '@/components/loadings/table-skeleton';
import { Button } from '@/components/ui/button';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FAQs',
};

export default function FaqListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">FAQs</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">List of all Frequently Asked Questions.</h2>

      <TooltipWrapper text="Create FAQ">
        <Button asChild variant="outline" className="mb-5 h-auto text-base px-3 py-1.5 inline-block">
          <Link href="/faq/new"><Plus className="icon" /> Create</Link>
        </Button>
      </TooltipWrapper>

      <Suspense fallback={<TableSekeleton />}>
        <FaqsTable />
      </Suspense>
    </>
  );
}
