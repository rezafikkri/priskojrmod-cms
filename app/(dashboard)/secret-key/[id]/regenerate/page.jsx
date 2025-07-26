import SecretKeyForm from '@/components/secret-key/secret-key-form';
import { Suspense } from 'react';
import FormSkeleton from '@/components/loadings/form-skeleton';

export const metadata = {
  title: 'Regenerate Secret Key',
};

export default async function SecretKeyRegeneratePage({ params }) {
  const { id } = await params;
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-1 font-bold">Regenerate Secret Key</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">Only regenerate the secret key when necessary, such as in case of a leak or other security issue.</h2>

      <Suspense fallback={<FormSkeleton />}>
        <SecretKeyForm id={id} mode='regenerate' />
      </Suspense>
    </section>
  );
}
