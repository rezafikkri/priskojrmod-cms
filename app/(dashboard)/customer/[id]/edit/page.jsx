import CustomerForm from '@/components/customer/customer-form';
import FormSkeleton from '@/components/loadings/form-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Edit Customer',
};

export default async function CustomerEditPage({ params }) {
  const { id } = await params;

  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Edit Customer</h1>

      <Suspense fallback={<FormSkeleton />}>
        <CustomerForm id={id} />
      </Suspense>
    </section>
  );
}
