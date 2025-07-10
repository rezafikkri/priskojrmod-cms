import FaqForm from '@/components/faq/faq-form';
import FormSkeleton from '@/components/loadings/form-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Edit FAQ',
};

export default async function FaqEditPage({ params }) {
  const { id } = await params;
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Edit FAQ</h1>
      <Suspense fallback={<FormSkeleton />}>
        <FaqForm id={id} />
      </Suspense>
    </>
  );
}
