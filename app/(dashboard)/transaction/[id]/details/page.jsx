import { getTransactionDetails } from '@/lib/services/transaction-service';

export const metadata = {
  title: 'Transaction Details',
};

export default async function TransactionDetailsPage({ params }) {
  const { id } = await params;
  const transaction = await getTransactionDetails(id);

  return (
    <section>
      <h1 className="text-2xl mb-7 font-bold">Transaction Details</h1>
    </section>
  );
}
