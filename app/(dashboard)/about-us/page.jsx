import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';
import AboutUsForm from '@/components/about-us/about-us-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'About Us',
};

export default function AboutUsPage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">About Us</h1>

      <Suspense fallback={<FormSkeleton />}>
        <AboutUsForm />
      </Suspense>
    </>
  );
}
