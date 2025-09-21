import { formatDateTime } from '@/lib/format-date';
import { getTransactionDetails } from '@/lib/services/transaction-service';
import { formatCurrency, getStatusClasses } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Banknote } from 'lucide-react';
import { Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';

export const metadata = {
  title: 'Transaction Details',
};

export default async function TransactionDetailsPage({ params }) {
  const { id } = await params;
  const transaction = await getTransactionDetails(id);

  return (
    <>
      <section className="lg:max-w-2/3 mb-7">
        <h2 className="text-[1.4rem] mb-5 font-bold">Transaction Info</h2>

        <div className="space-y-4">
          <dl className="space-y-1.5">
            <dt className="flex items-center text-zinc-600">
              <Banknote className="icon me-1 text-zinc-400" />
              <span>Total Amount</span>
            </dt>
            <dd className="space-x-5 flex items-center">
              <span
                className="text-[1.4rem] font-semibold"
              >
                {formatCurrency(transaction.total_amount, transaction.currency_code)}
              </span>
              <span
                className={`px-2 py-1 rounded-lg capitalize font-medium ${getStatusClasses(transaction.status)}`}
              >
                {transaction.status}</span>
            </dd>
          </dl>
          <Separator />

          <div className="flex gap-10">
            <dl>
              <dt className="text-zinc-700 mb-1">Created At</dt>
              <dd className="mb-6">{formatDateTime(transaction.created_at)}</dd>

              <dt className="text-zinc-700 mb-1">Updated At</dt>
              <dd>{formatDateTime(transaction.updated_at)}</dd>
            </dl>

            <Separator orientation="vertical" className="!h-25 mt-3" />
            <dl>
              <dt className="mb-1 text-zinc-700">Transaction Code</dt>
              <dd>{transaction.code}</dd>
            </dl>
          </div>

          <Separator />
          <Table className="text-base">
            <TableBody>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal text-zinc-700 w-60">Customer Name</TableHead>
                <TableCell>{transaction.customer_name}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal text-zinc-700">Customer Email</TableHead>
                <TableCell>{transaction.customer_email}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal text-zinc-700">Customer Phone Number</TableHead>
                <TableCell>
                  {transaction.customer_phone_number ?? <Minus className="icon text-zinc-300" />}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="lg:max-w-2/3">
        <h2 className="text-[1.4rem] mb-5 font-bold">Transaction Details</h2>

        {transaction.details.map(detail => (
          <div className="rounded-md border" key={detail.id}>
            <Table className="text-base">
              <TableBody>
                <TableRow>
                  <TableHead className="font-normal text-zinc-700 w-60">Product Name</TableHead>
                  <TableCell>{detail.product_name}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="font-normal text-zinc-700">Version</TableHead>
                  <TableCell>{detail.product_version}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="font-normal text-zinc-700">Variant</TableHead>
                  <TableCell>{detail.product_variant}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}        
      </section>
    </>
  );
}
