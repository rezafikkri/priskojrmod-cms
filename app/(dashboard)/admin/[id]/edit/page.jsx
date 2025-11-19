import AdminForm from '@/components/admin/admin-form';
import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';

export const metadata = {
  title: 'Edit Admin',
};

export default async function AdminEditPage({ params }) {
  const { id } = await params;

  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Edit Admin</h1>
      <Suspense fallback={<FormSkeleton />}>
        <AdminForm id={id} />
      </Suspense>
    </section>
  );
}
