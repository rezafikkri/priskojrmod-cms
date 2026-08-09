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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Minus } from 'lucide-react';
import { toast } from 'sonner';
import { removeSecretKey } from '@/actions/secret-key-actions';
import DeleteDialog from './delete-dialog';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import Link from 'next/link';
import { cmsConfig } from '@/config/cms';
import { useDialog } from '@/hooks/use-dialog';
import { useQueryClient } from '@tanstack/react-query';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableResultCount from '../ui/table-result-count';
import { callAction } from '@/lib/call-action';

export default function DataTable({ secretKeys: data }) {
  const [secretKeys, setSecretKeys] = useState(data);
  const [deletingIds, setDeletingIds] = useState([]);
  const queryClient = useQueryClient();

  // dialog state
  const {
    data: deleteData,
    isOpen: isOpenDeleteDialog,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();

  async function handleDelete({ id }) {
    setDeletingIds((prevIds) => [...prevIds, id]);
    // show loading
    const toastId = toast.loading('Deleting secret key...');

    const removeRes = await callAction(() => removeSecretKey(id));

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      setSecretKeys((prevSecretKeys) =>
        prevSecretKeys.filter((s) => s.id !== id)
      );

      queryClient.invalidateQueries({ queryKey: ['secretKeyOptions'] });

      toast.success('Secret key deleted successfully.', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }

  const columns = useMemo(() => [
    {
      id: 'appName',
      accessorKey: 'product.name',
      header: 'App Name',
    },
    {
      accessorKey: 'createdAt',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      accessorKey: 'regeneratedAt',
      header: () => 'Regenerated At',
      cell: ({ row }) => 
        row.getValue('regeneratedAt')
          ? formatDateTime(row.getValue('regeneratedAt'))
          : <Minus className="size-4 text-zinc-300" />,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <TableActionDropdown disabled={deletingIds.includes(row.original.id)}>
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem className="w-full text-base" asChild>
              <button onClick={() => {
                navigator.clipboard.writeText(row.original.key);
                toast.success('Secret key copied to clipboard');
              }}>
                Copy secret key
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-base hover:cursor-pointer">
              <Link href={`/secret-key/${row.original.id}/regenerate`}>Regenerate</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5" />
            <DropdownMenuItem className="w-full text-base" asChild>
              <button onClick={() => openDeleteDialog({
                id: row.original.id,
                appName: row.getValue('appName'),
              })}>
                Delete
              </button>
            </DropdownMenuItem>
          </TableActionDropdown>
        );
      },
    }
  ], [deletingIds, openDeleteDialog]);
  const table = useReactTable({
    data: secretKeys,
    columns,
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

      <TableResultCount data={secretKeys} />

      <DeleteDialog
        onDelete={handleDelete}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        deleteData={deleteData}
      />
    </>
  );
}
