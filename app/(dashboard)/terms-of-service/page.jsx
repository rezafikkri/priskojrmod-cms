import { Suspense } from 'react';
import TermsOfSeviceForm from '@/components/terms-of-service/terms-of-service-form';
import FormSkeleton from '@/components/loadings/form-skeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Terms Of Service',
};

export default function TermsOfServicePage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Terms Of Service</h1>

      <Suspense fallback={<FormSkeleton />}>
        <TermsOfSeviceForm />
      </Suspense>
    </>
  );
}
