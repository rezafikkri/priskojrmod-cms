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
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { removeOwner } from '@/actions/owner-actions';

export default function DataTable({ owners: data }) {
  const [owners, setOwners] = useState(data)
  const [deletingIds, setDeletingIds] = useState([]);

  async function handleDelete(id) {
    // This is for add opacity-50 style to deleted row
    setDeletingIds((prevDeletingIds) => [...prevDeletingIds, id]);
    // show loading
    const toastId = toast.loading('Deleting owner...');

    const removeRes = await removeOwner(id);

    setDeletingIds((prevDeletingIds) =>
      prevDeletingIds.filter((deletingId) => deletingId !== id)
    );

    if (removeRes.status === 'success') {
      setOwners((prevOwners) =>
        prevOwners.filter((owner) => owner.id !== id)
      );
      toast.success('Owner deleted successfully.', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, {
        id: toastId,
      });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'first_name',
      header: 'Name',
    },
    {
      accessorKey: 'sm_username',
      header: 'Social Media Username',
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
                disabled={deletingIds.includes(row.original.id)}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link href={`/owner/${row.original.id}/edit`}>Edit</Link>
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
  ], [deletingIds]);
  const table = useReactTable({
    data: owners,
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
                  className={deletingIds.includes(row.original.id) ? 'opacity-50' : ''}
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

      {owners.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {owners.length} {owners.length === 1 ? 'result' : 'results'}
        </p>
      )}
    </>
  );
}
