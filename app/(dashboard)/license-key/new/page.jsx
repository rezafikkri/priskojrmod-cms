import LicenseKeyForm from '@/components/license-key/license-key-form';
import FormSkeleton from '@/components/loadings/form-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Create License Key',
};

export default function LicenseKeyCreatePage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Create License Key</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">Once the License Key is successfully created, it will be valid for one year from the creation date.</h2>
      <Suspense fallback={<FormSkeleton />}>
        <LicenseKeyForm />
      </Suspense>
    </>
  );
}
