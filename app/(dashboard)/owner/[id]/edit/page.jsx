import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';
import OwnerForm from '@/components/owner/owner-form';

export const metadata = {
  title: 'Edit Owner',
};

export default async function OwnerEditPage({ params }) {
  const { id } = await params;
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Edit Owner</h1>
      <Suspense fallback={<FormSkeleton />}>
        <OwnerForm id={id} />
      </Suspense>
    </>
  );
}
