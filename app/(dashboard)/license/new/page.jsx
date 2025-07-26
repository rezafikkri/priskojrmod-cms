import CreateForm from '@/components/license/create-form';

export const metadata = {
  title: 'Create License',
};

export default function LicenseCreatePage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Create License</h1>
      <CreateForm />
    </section>
  );
}
