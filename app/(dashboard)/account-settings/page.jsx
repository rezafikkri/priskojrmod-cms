import AccountSettingsForm from '@/components/account-settings/account-settings-form';
import FormSkeleton from '@/components/loadings/form-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Account Settings',
};

export default function AccountSettingsPage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-xl mb-7 font-bold">Account Settings</h1>
      <Suspense fallback={<FormSkeleton />}>
        <AccountSettingsForm />
      </Suspense>
    </section>
  );
}
