
import TransactionsTable from '@/components/transaction/transactions-table';

export const metadata = {
  title: 'Transactions',
};

export default async function TransactionListPage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Transactions</h1>
      <TransactionsTable />
    </>
  );
}
