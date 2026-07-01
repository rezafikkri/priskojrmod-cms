'use client';

import { formatDateTime } from '@/lib/format-date';
import { getStatusClasses } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
import { Separator } from '@/components/ui/separator';
import { Banknote, Minus } from 'lucide-react';

export default function InfoSection({ info }) {
  return (
    <div className="space-y-4 mt-2.5">
      <dl className="space-y-1.5">
        <dt className="flex items-center text-zinc-600 dark:text-zinc-400">
          <Banknote className="me-1 text-zinc-400 dark:text-zinc-400/80" />
          <span>Total Amount</span>
        </dt>
        <dd className="space-x-5 flex items-center">
          <span
            className="text-lg font-semibold tabular-nums"
          >
            {formatCurrency({
              value: info.totalAmount,
              currencyCode: info.currencyCode,
            })}
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
          <dd className="mb-6">{formatDateTime(info.createdAt)}</dd>

          <dt className="text-zinc-700 dark:text-zinc-300 mb-1">Paid At</dt>
          <dd>{info.paidAt ? formatDateTime(info.paidAt) : <Minus className="size-4 text-zinc-300" />}</dd>
        </dl>

        <Separator orientation="vertical" className="!h-25 mt-3" />

        <dl>
          <dt className="text-zinc-700 dark:text-zinc-300 mb-1">Refunded At</dt>
          <dd className="mb-6">
            {info.refundedAt ? formatDateTime(info.refundedAt) : <Minus className="size-4 text-zinc-300" />}
          </dd>

          <dt className="text-zinc-700 dark:text-zinc-300 mb-1">Updated At</dt>
          <dd>{formatDateTime(info.updatedAt)}</dd>
        </dl>
      </div>
    </div>
  );
}
