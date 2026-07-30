'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format-date';
import { InvoiceStatus } from '@/constants/enums';
import NotFoundAlert from '../ui/not-found-alert';

export default function InvoiceSection({ invoice }) {
  if (!invoice) {
    return <NotFoundAlert message="Invoice not found" className="mt-2.5 mb-4" />;
  }

  function getTextStatusColor(status) {
    if (status === InvoiceStatus.UNPAID) return 'text-gray-700 dark:text-gray-600';
    if (status === InvoiceStatus.REFUND) return 'text-amber-700 dark:text-amber-600';
    if (status === InvoiceStatus.CANCELLED) return 'text-red-700 dark:text-red-600';
    return 'text-green-700 dark:text-green-600';
  }

  return (
    <div className="rounded-md border mt-2.5">
      <Table className="text-base">
        <TableBody>
          <TableRow>
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Invoice Number</TableHead>
            <TableCell>{invoice.invoiceNumber}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Status</TableHead>
            <TableCell className={`capitalize ${getTextStatusColor(invoice.status)}`}>
              {invoice.status}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Issued At</TableHead>
            <TableCell>{formatDateTime(invoice.issuedAt)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
