import CreateForm from '@/components/customer/create-form';

export const metadata = {
  title: 'Create Customer',
};

export default function CustomerCreatePage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-1 font-bold">Create Customer</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">Some customer information, like phone number, must be provided by the customer and cannot be entered by the admin.</h2>

      <CreateForm />
    </section>
  );
}
