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
import { removeAdmin } from '@/actions/admin-actions';
import { getTableHeaderWidth } from '@/lib/utils';
import ProfileBadge from '../ui/profile-badge';
import DeleteDialog from '../ui/delete-dialog';
import { cmsConfig } from '@/config/cms';
import { useDialog } from '@/hooks/use-dialog';

export default function DataTable({ admins: data }) {
  const [admins, setAdmins] = useState(data);
  const [deletingIds, setDeletingIds] = useState([]);

  // dialog state
  const {
    data: deleteData,
    isOpen: isOpenDeleteDialog,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();

  async function handleDelete({ id }) {
    // This is for add opacity-50 style to deleted row
    setDeletingIds((prevIds) => [...prevIds, id]);
    // show loading
    const toastId = toast.loading('Deleting admin...');
    
    const removeRes = await removeAdmin(id);

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      setAdmins((prevAdmins) => prevAdmins.filter(admin => admin.id !== id));
      toast.success('Admin deleted successfully', {
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
              <Link href={`/admin/${row.original.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5" />
            <DropdownMenuItem className="w-full text-base" asChild>
              <button
                onClick={() => openDeleteDialog({
                  id: row.original.id,
                  email: row.getValue('email'),
                })}
              >
                Delete
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {admins.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {admins.length} {admins.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        description={`Admin <b>${deleteData?.email}</b> (role: Staff) will be permanently deleted.`}
      />
    </>
  );
}
