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
import { formatCurrency } from '@/lib/format-currency';
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
              <TableCell>{detail.productName}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-50">Category</TableHead>
              <TableCell>{detail.productCategorySlug}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Version</TableHead>
              <TableCell>{detail.productVersion}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Variant</TableHead>
              <TableCell>{detail.productVariant}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Quantity</TableHead>
              <TableCell>{detail.quantity}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Currency</TableHead>
              <TableCell>{detail.productCurrencyCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Price</TableHead>
              <TableCell className="tabular-nums">
                {formatCurrency({
                  value: detail.productPrice,
                  currencyCode: detail.productCurrencyCode,
                })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Discount</TableHead>
              <TableCell>
                {detail.productDiscount
                  ? `${detail.productDiscount}%`
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Coupon Code</TableHead>
              <TableCell>
                {detail.productCouponCode ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Coupon Discount</TableHead>
              <TableCell>
                {detail.productCouponDiscount
                  ? `${detail.productCouponDiscount}%`
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Subtotal</TableHead>
              <TableCell className="tabular-nums">
                {formatCurrency({
                  value: detail.subtotal,
                  currencyCode: detail.productCurrencyCode,
                })}
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
                {detail.shareMethod
                  ? detail.shareMethod.replace('_', ' ')
                  : <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Shared At</TableHead>
              <TableCell>
                {detail.sharedAt
                  ? formatDateTime(detail.sharedAt)
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
                {detail.productDriveFileId ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Download Link</TableHead>
              <TableCell>
                {detail.productDownloadUrl ?? <Minus className="icon text-zinc-300" />}
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
                {detail.variantDownloadUrl ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">File Access Password</TableHead>
              <TableCell>
                {detail.variantFileAccessPassword ?? <Minus className="icon text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Fragment>
  ));
}
