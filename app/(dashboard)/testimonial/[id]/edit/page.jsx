import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';
import TestimonialForm from '@/components/testimonial/testimonial-form';

export const metadata = {
  title: 'Edit Testimonial',
};

export default async function TestimonialEditPage({ params }) {
  const { id } = await params;

  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Edit Testimonial</h1>

      <Suspense fallback={<FormSkeleton />}>
        <TestimonialForm id={id} />
      </Suspense>
    </section>
  );
}
