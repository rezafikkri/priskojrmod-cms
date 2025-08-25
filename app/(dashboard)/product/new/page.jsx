import FormSkeleton from '@/components/loadings/form-skeleton';
import ProductForm from '@/components/product/product-form';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Product',
};

export default function CreateProductPage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Create Product</h1>

      <Suspense fallback={<FormSkeleton />}>
        <ProductForm />
      </Suspense>
    </section>
  );
}
