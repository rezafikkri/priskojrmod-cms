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
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format-date';
import { removeAdmin } from '@/actions/admin-actions';
import { getTableHeaderWidth } from '@/lib/utils';
import ProfileBadge from '../ui/profile-badge';
import DeleteDialog from '../ui/delete-dialog';
import { cmsConfig } from '@/config/cms';
import { useDialog } from '@/hooks/use-dialog';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableResultCount from '../ui/table-result-count';
import { useQueryClient } from '@tanstack/react-query';

export default function DataTable({ admins: data }) {
  const [admins, setAdmins] = useState(data);
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
    const toastId = toast.loading('Deleting admin...');
    
    const removeRes = await removeAdmin(id);

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      setAdmins((prevAdmins) => prevAdmins.filter(admin => admin.id !== id));

      queryClient.invalidateQueries({ queryKey: ['adminOptions'] });

      toast.success('Admin deleted successfully.', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, {
        duration: cmsConfig.toast.duration.error,
        id: toastId,
      });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ProfileBadge
            src={row.original.picture}
            fallbackText={row.getValue('name')}
          />
          <span className="text-wrap">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updatedAt')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <TableActionDropdown disabled={deletingIds.includes(row.original.id)}>
          <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
            <Link href={`/admin/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="-mx-1.5" />
          <DropdownMenuItem className="w-full text-base" asChild>
            <button onClick={() => openDeleteDialog({
              id: row.original.id,
              email: row.getValue('email'),
              name: row.getValue('name'),
            })}>
              Delete
            </button>
          </DropdownMenuItem>
        </TableActionDropdown>
      ),
    }
  ], [deletingIds, openDeleteDialog]);
  const table = useReactTable({
    data: admins,
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

      <TableResultCount data={admins} />

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        title="Delete Admin"
        description={`Admin <b>${deleteData?.name}</b> <span class="break-all">(${deleteData?.email})</span> will be permanently deleted.`}
      />
    </>
  );
}
