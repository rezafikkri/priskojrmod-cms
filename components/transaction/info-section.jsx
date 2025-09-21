'use client';

import { formatDateTimeWIB } from '@/lib/format-date';
import { formatCurrency, getStatusClasses } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Banknote, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';

export default function InfoSection({ info }) {
  return (
    <div className="space-y-4 mt-2.5">
      <dl className="space-y-1.5">
        <dt className="flex items-center text-zinc-600 dark:text-zinc-400">
          <Banknote className="icon me-1 text-zinc-400 dark:text-zinc-400/80" />
          <span>Total Amount</span>
        </dt>
        <dd className="space-x-5 flex items-center">
          <span
            className="text-lg font-semibold tabular-nums"
          >
            {formatCurrency(info.total_amount, info.currency_code)}
          </span>
          <span
            className={`px-2 py-1 rounded-lg capitalize font-medium ${getStatusClasses(info.status)}`}
          >
            {info.status}</span>
        </dd>
      </dl>
      <Separator />

      <div className="flex gap-10">
        <dl>
          <dt className="text-zinc-700 dark:text-zinc-300 mb-1">Created At</dt>
          <dd className="mb-6">{formatDateTimeWIB(info.created_at)}</dd>

          <dt className="text-zinc-700 dark:text-zinc-300 mb-1">Updated At</dt>
          <dd>{formatDateTimeWIB(info.updated_at)}</dd>
        </dl>

        <Separator orientation="vertical" className="!h-25 mt-3" />
        <dl>
          <dt className="mb-1 text-zinc-700 dark:text-zinc-300">Transaction Code</dt>
          <dd>{info.code}</dd>
        </dl>
      </div>

      <Separator />
      <Table className="text-base -mx-2">
        <TableBody>
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-60">Customer Name</TableHead>
            <TableCell>{info.customer_name}</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Customer Email</TableHead>
            <TableCell>{info.customer_email}</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Customer Phone Number</TableHead>
            <TableCell>
              {info.customer_phone_number ?? <Minus className="icon text-zinc-300" />}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
