import FormSkeleton from '@/components/loadings/form-skeleton';
import PrivacyPolicyForm from '@/components/privacy-policy/privacy-policy-form';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Privacy Policy</h1>

      <Suspense fallback={<FormSkeleton />}>
        <PrivacyPolicyForm />
      </Suspense>
    </>
  );
}
