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
import { MoreHorizontal, Check, Minus } from 'lucide-react';
import Dot from '../icon/Dot';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
import { CurrencyCode, PriceType } from '@/constants/enums';
import { Badge } from '../ui/badge';
import DeleteDialog from './delete-dialog';

export default function DataTable({
  products,
  tableState,
  tableHandler,
}) {
  const { 
    onColumnVisibilityChange,
    onEditPinnedStatus,
    onEditPublishedStatus,
    onDelete,
  } = tableHandler;
  const {
    columnVisibility,
    updatingPinnedStatusIds,
    updatingPublishedIds,
    deletingIds,
  } = tableState;
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState(process.env.NEXT_PUBLIC_DEFAULT_DATA_CURR);

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
                className="bg-green-50 dark:bg-green-900 ms-3 text-xs text-green-700 dark:text-green-300"
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
      id: 'category',
      accessorKey: 'category.name',
      header: 'Category',
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
          const min = formatCurrency({
            value: prices.min,
            currencyCode: priceCurrency,
          });
          const max = formatCurrency({
            value: prices.max,
            currencyCode: priceCurrency,
          });

          if (!prices) return <Minus className="size-4 text-zinc-300" />;
          if (prices.min === prices.max) {
            return <span className="tabular-nums">{min}</span>;
          }
          
          return <span className="tabular-nums">{min}&ndash;{max}</span>;
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
            : <Dot className="size-4 text-zinc-300 dark:text-zinc-700 inline-block" />
        }</div>
      ),
    },
    {
      accessorKey: 'released_at',
      header: 'Released At',
      cell: ({ row }) => formatDateTime(row.getValue('released_at')),
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => (
        <div>
          {row.original.admin.isCurrentUser ? (
            <p>Myself</p>
          ) : (
            <>
              <p>{row.original.admin.first_name} {row.original.admin.last_name}</p>
              <p className="text-sm text-zinc-600">{row.original.admin.email}</p>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('created_at')),
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updated_at')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 focus-visible:ring-ring"
                disabled={
                  updatingPinnedStatusIds.includes(row.original.id) ||
                  updatingPublishedIds.includes(row.original.id) ||
                  deletingIds.includes(row.original.id)
                }
              >
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
                  onClick={() => onEditPinnedStatus(
                    row.original.id,
                    row.original.is_pinned,
                  )}
                >
                  {row.original.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button
                  onClick={() => onEditPublishedStatus(
                    row.original.id,
                    row.original.is_published,
                  )}
                >
                  {row.getValue('is_published') ? 'Unpublish' : 'Publish'}
                </button>
              </DropdownMenuItem>
              {!row.original.is_pinned && !row.getValue('is_published') && (
                <>
                  <DropdownMenuSeparator className="-mx-1.5" />
                  <DropdownMenuItem
                    className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                    asChild
                  >
                    <button
                      onClick={() => {
                        setDeleteData({ id: row.original.id, name: row.getValue('name') });
                        setIsOpenDeleteDialog(true);
                      }}
                    >
                      Delete
                    </button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [priceCurrency, updatingPinnedStatusIds, updatingPublishedIds, deletingIds]);
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
                <TableRow
                  key={row.id}
                  className={
                    (
                      updatingPinnedStatusIds.includes(row.original.id) ||
                      updatingPublishedIds.includes(row.original.id) ||
                      deletingIds.includes(row.original.id)
                    )
                      ? 'opacity-50'
                      : ''
                  }
                >
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

      <DeleteDialog
        onDelete={onDelete}
        isOpenDeleteDialog={isOpenDeleteDialog}
        setIsOpenDeleteDialog={setIsOpenDeleteDialog}
        deleteData={deleteData}
        setDeleteData={setDeleteData}
      />
    </>
  );
}
