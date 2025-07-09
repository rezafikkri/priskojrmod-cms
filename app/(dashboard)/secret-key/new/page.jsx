import FormSkeleton from '@/components/loadings/form-skeleton';
import SecretKeyForm from '@/components/secret-key/secret-key-form';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Secret Key',
};

export default function SecretKeyCreatePage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Create Secret Key</h1>

      <Suspense fallback={<FormSkeleton />}>
        <SecretKeyForm />
      </Suspense>
    </>
  );
}
