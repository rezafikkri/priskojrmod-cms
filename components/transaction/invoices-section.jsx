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
import { InvoiceStatus } from '@/constants/enums';
import NotFoundAlert from '../ui/not-found-alert';

export default function InvoicesSection({ invoices }) {
  if (invoices.length <= 0) {
    return <NotFoundAlert message="Invoice not found" className="mt-2.5 mb-4" />;
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

      <div className="rounded-md border mt-1.5">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Invoice Number</TableHead>
              <TableCell>{invoice.invoiceNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Status</TableHead>
              <TableCell className={`capitalize ${getTextStatusColor(invoice.status)}`}>{invoice.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Issued At</TableHead>
              <TableCell>{formatDateTime(invoice.issuedAt)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Voided At</TableHead>
              <TableCell>
                {invoice.voidedAt
                  ? formatDateTime(invoice.voidedAt)
                  : <Minus className="size-4 text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Fragment>
  ));
}
