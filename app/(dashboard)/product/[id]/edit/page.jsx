import ProductForm from '@/components/product/product-form';
import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';

export const metadata = {
  title: 'Edit Product',
};

export default async function ProductEditPage({ params }) {
  const { id } = await params;

  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Edit Product</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ProductForm mode="edit" id={id} />
      </Suspense>
    </>
  );
}
