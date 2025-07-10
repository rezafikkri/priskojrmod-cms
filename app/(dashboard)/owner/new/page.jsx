import CreateForm from '@/components/owner/create-form';

export const metadata = {
  title: 'Create Secret Key',
};

export default function OwnerCreatePage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Create Owner</h1>
      <CreateForm />
    </>
  );
}
