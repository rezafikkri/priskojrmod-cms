'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Check } from 'lucide-react';
import Dot from '../icon/Dot';
import Link from 'next/link';
import { formatDateTimeWIB } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { CurrencyCode, PriceType } from '@/constants/enums';
import { Badge } from '../ui/badge';

export default function DataTable({
  products,
  columnVisibility,
  tableHandler,
}) {
  const { 
    onColumnVisibilityChange,
    onEditPinnedStatus,
    onEditPublishedStatus,
  } = tableHandler;
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState(CurrencyCode.IDR);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        if (row.original.is_pinned) {
          return (
            <>
              <span>{row.getValue('name')}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 dark:bg-green-900 ms-3 text-xs text-green-800 dark:text-green-300"
              >
                Pinned
              </Badge>
            </>
          );
        }
        return row.getValue('name');
      },
    },
    {
      accessorKey: 'prices',
      header: () => (
        <>
          <span>Price</span>
          <div className="ms-4 inline-block space-x-1">
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.IDR ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.IDR)}
            >
              IDR
            </Button>
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.USD ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.USD)}
            >
              USD
            </Button>
          </div>
        </>
      ),
      cell: ({ row }) => {
        if (row.original.price_type === PriceType.PAID) {
          const prices = row.getValue('prices')[priceCurrency];
          let locale = priceCurrency === CurrencyCode.IDR ? 'id-ID' : 'en-US';

          if (prices.min === prices.max) {
            return `${priceCurrency} ${prices.min.toLocaleString(locale)}`;
          }
          return (
            <>
              {priceCurrency} <span className="tabular-nums">{prices.min.toLocaleString(locale)}</span>-<span className="tabular-nums">{prices.max.toLocaleString(locale)}</span>
            </>
          );
        }
        return PriceType.FREE[0].toUpperCase() + PriceType.FREE.substring(1);
      },
    },
    {
      accessorKey: 'is_published',
      header: <div className="text-center">Published</div>,
      cell: ({ row }) => (
        <div className="text-center">{
          row.getValue('is_published')
            ? <Check className="size-4 inline-block" />
            : <Dot className="size-4 text-zinc-300/50 dark:text-zinc-800 inline-block" />
        }</div>
      ),
    },
    {
      accessorKey: 'released_at',
      header: 'Released At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('released_at')),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('created_at')),
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('updated_at')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 focus-visible:ring-ring">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-50">
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link href={`/product/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button
                  onClick={() =>
                    onEditPinnedStatus({
                      id: row.original.id,
                      name: row.getValue('name'),
                      isPinned: row.original.is_pinned,
                    })
                  }
                >
                  {row.original.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button
                  onClick={() => onEditPublishedStatus({
                    id: row.original.id,
                    name: row.getValue('name'),
                    isPublished: row.original.is_published,
                  })}
                >
                  {row.getValue('is_published') ? 'Unpublish' : 'Publish'}
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5" />
              <DropdownMenuItem
                className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                asChild
              >
                <button onClick={() => handleDelete(row.original.id)}>
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [products, priceCurrency]);
  const table = useReactTable({
    data: products,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`px-3 py-2.5 h-auto text-zinc-600 dark:text-zinc-400 ${getTableHeaderWidth(header.id)}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} id={'row' + row.original.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`p-3 ${cell.column.id === 'actions' ? 'text-right' : '' }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {products.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {products.length} {products.length === 1 ? 'result' : 'results'}
        </p>
      )}
    </>
  );
}
