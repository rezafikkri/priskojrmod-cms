'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Minus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Fragment } from 'react';
import { formatDateTime } from '@/lib/format-date';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import Error404 from '../icon/error-404';
import { InvoiceStatus } from '@/constants/enums';

export default function InvoicesSection({ invoices }) {
  if (invoices.length <= 0) {
    return (
      <Alert className="text-base mt-2.5 mb-4">
        <Error404 />
        <AlertTitle>Invoice not found</AlertTitle>
      </Alert>
    );
  }

  function getTextStatusColor(status) {
    if (status === InvoiceStatus.ACTIVE) return 'text-green-700 dark:text-green-600';
    return 'text-red-700 dark:text-red-600';
  }

  return invoices.map((invoice, index) => (
    <Fragment key={invoice.id}>
      {invoices.length > 1 && (
        <div className="relative flex items-center mt-2.5">
          <Separator className="!w-5 me-1" />
          <h4>Invoice {index + 1}</h4>
          <Separator className="flex-1 ms-1" />
        </div>
      )}

      <div className="rounded-md border mb-4 mt-1.5">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Invoice Number</TableHead>
              <TableCell>{invoice.invoice_number}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Status</TableHead>
              <TableCell className={`capitalize ${getTextStatusColor(invoice.status)}`}>{invoice.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Issued At</TableHead>
              <TableCell>{formatDateTime(invoice.issued_at)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Voided At</TableHead>
              <TableCell>
                {invoice.voided_at
                  ? formatDateTime(invoice.voided_at)
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Fragment>
  ));
}
