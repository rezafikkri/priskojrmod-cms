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
import { formatDateTimeWIB } from '@/lib/format-date';
import { removeCategory } from '@/actions/category-actions';
import { getTableHeaderWidth } from '@/lib/utils';

export default function DataTable({ categories: data }) {
  const [categories, setCategories] = useState(data);

  async function handleDelete(id) {
    const targetRow = document.querySelector(`#row${id}`);
    const targetActionBtn = targetRow.querySelector('td > button');
    targetRow.classList.add('opacity-50');
    targetActionBtn.setAttribute('disabled', true);
    // show loading
    const toastId = toast.loading('Deleting Category...');
    
    const removeRes = await removeCategory(id);

    targetRow.classList.remove('opacity-50');
    targetActionBtn.removeAttribute('disabled');

    if (removeRes.status === 'success') {
      setCategories(categories.filter(category => category.id !== id));
      toast.success('Category deleted successfully.', {
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
      accessorKey: 'name',
      header: 'Name',
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link href={`/category/${row.original.id}/edit`}>Edit</Link>
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
  ], [categories]);
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

      {categories.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {categories.length} {categories.length === 1 ? 'result' : 'results'}
        </p>
      )}
    </>
  );
}
