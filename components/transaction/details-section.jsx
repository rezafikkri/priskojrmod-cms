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
import { formatCurrency } from '@/lib/utils';
import { formatDateTime } from '@/lib/format-date';

export default function DetailsSection({ details }) {
  return details.map((detail, index) => (
    <Fragment key={detail.id}>
      {details.length > 1 && (
        <div className="relative flex items-center mt-2.5 mb-1">
          <Separator className="!w-5 me-1" />
          <h4>Product {index + 1}</h4>
          <Separator className="flex-1 ms-1" />
        </div>
      )}

      <h5 className="mt-1.5 mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">Details</h5>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-50">Name</TableHead>
              <TableCell>{detail.product_name}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Version</TableHead>
              <TableCell>{detail.product_version}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Variant</TableHead>
              <TableCell>{detail.product_variant}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Quantity</TableHead>
              <TableCell>{detail.quantity}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Currency</TableHead>
              <TableCell>{detail.product_currency_code}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Price</TableHead>
              <TableCell className="tabular-nums">
                {formatCurrency(detail.product_price, detail.product_currency_code)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Discount</TableHead>
              <TableCell>
                {detail.product_discount
                  ? `${detail.product_discount}%`
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Coupon Code</TableHead>
              <TableCell>
                {detail.product_coupon_code ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Coupon Discount</TableHead>
              <TableCell>
                {detail.product_coupon_discount
                  ? `${detail.product_coupon_discount}%`
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Subtotal</TableHead>
              <TableCell className="tabular-nums">
                {formatCurrency(detail.subtotal, detail.product_currency_code)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h5 className="mt-2 mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">Distribution</h5>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-50">Share Method</TableHead>
              <TableCell className="capitalize">
                {detail.share_method
                  ? detail.share_method.replace('_', ' ')
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Shared At</TableHead>
              <TableCell>
                {detail.shared_at
                  ? formatDateTime(detail.shared_at)
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h5 className="mt-2 mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">Main File</h5>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-50">Drive File ID</TableHead>
              <TableCell>
                {detail.product_drive_file_id ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Download Link</TableHead>
              <TableCell>
                {detail.product_download_link ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h5 className="mt-2 mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">Variant File</h5>
      <div className="rounded-md border mb-4">
        <Table className="text-base">
          <TableBody>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-50">Download Link</TableHead>
              <TableCell>
                {detail.variant_download_link ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">File Access Password</TableHead>
              <TableCell>
                {detail.variant_file_access_password ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Fragment>
  ));
}
