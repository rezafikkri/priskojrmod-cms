import CreateForm from '@/components/category/create-form';

export const metadata = {
  title: 'Create Category',
};

export default function CategoryCreatePage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Create Category</h1>
      <CreateForm />
    </>
  );
}
