import CreateForm from '@/components/admin/create-form';

export const metadata = {
  title: 'Create Admin',
};

export default function AdminCreatePage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Create Admin</h1>
      <CreateForm />
    </section>
  );
}
