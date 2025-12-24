import { Suspense } from 'react';
import TestimonialsTable from '@/components/testimonial/testimonials-table';
import TablePaginationSkeleton from '@/components/loadings/table-pagination-skeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Testimonials',
};

export default async function TestimonialListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Testimonials</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">
        Testimonials are short statements from users that share their experiences or feedback. 
        Only up to 6 testimonials are allowed, which is ideal for maintaining focus and clarity.
      </h2>

      <Suspense fallback={<TablePaginationSkeleton showPagination={false} />}>
        <TestimonialsTable />
      </Suspense>
    </>
  );
}
