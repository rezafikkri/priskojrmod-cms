import LicenseForm from '@/components/license/license-form';
import FormSkeleton from '@/components/loadings/form-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Edit License',
};

export default async function LicenseEditPage({ params }) {
  const { id } = await params;
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Edit License</h1>
      <Suspense fallback={<FormSkeleton />}>
        <LicenseForm id={id} />
      </Suspense>
    </>
  );
}
