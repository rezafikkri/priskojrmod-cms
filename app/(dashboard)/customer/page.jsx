import CustomersTable from '@/components/customer/customers-table';

export const metadata = {
  title: 'Customers',
};

export default function CustomerListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Customers</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">List of customer accounts.</h2>

      <CustomersTable />
    </>
  );
}
