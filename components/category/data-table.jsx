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
import { removeCategory } from '@/actions/category-actions';
import { getTableHeaderWidth } from '@/lib/utils';
import { cmsConfig } from '@/config/cms';
import { APPLICATION_CATEGORY_SLUG } from '@/constants/categories';
import DeleteDialog from '../ui/delete-dialog';
import { useDialog } from '@/hooks/use-dialog';

export default function DataTable({ categories: data }) {
  const [categories, setCategories] = useState(data);
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
    const toastId = toast.loading('Deleting category...');
    
    const removeRes = await removeCategory(id);

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      setCategories((prevCategories) => prevCategories.filter(category => category.id !== id));
      toast.success('Category deleted successfully', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error,
      });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
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
      cell: ({ row }) => {
        if (row.original.slug === APPLICATION_CATEGORY_SLUG) return null;

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
                <Link href={`/category/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5" />
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => openDeleteDialog({
                  id: row.original.id,
                  name: row.getValue('name'),
                })}>
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [deletingIds, openDeleteDialog]);
  const table = useReactTable({
    data: categories,
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

      {categories.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {categories.length} {categories.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        title="Delete Category"
        description={`Category <b>${deleteData?.name}</b> will be permanently deleted.`}
      />
    </>
  );
}
