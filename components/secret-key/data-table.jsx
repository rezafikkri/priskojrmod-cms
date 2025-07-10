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
import { MoreHorizontal, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { removeSecretKey } from '@/actions/secret-key-actions';
import DeleteDialog from './delete-dialog';
import { formatDateTimeWIB } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import Link from 'next/link';

export default function DataTable({ secretKeys: data }) {
  const [secretKeys, setSecretKeys] = useState(data);
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  async function handleDelete({ deleteData, toastId }) {
    const targetRow = document.querySelector(`#row${deleteData.id}`);
    const targetActionBtn = targetRow.querySelector('td > button');
    targetRow.classList.add('opacity-50');
    targetActionBtn.setAttribute('disabled', true);

    const removeRes = await removeSecretKey(deleteData.id);

    targetRow.classList.remove('opacity-50');
    targetActionBtn.removeAttribute('disabled');
    
    if (removeRes.status === 'success') {
      setSecretKeys(secretKeys.filter(s => {
        return s.id !== deleteData.id;
      }));
      toast.success(`Secret key for ${deleteData.appName} was successfully deleted.`, {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, { id: toastId });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'app_name',
      header: 'App Name',
    },
    {
      accessorKey: 'created_at',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('created_at')),
    },
    {
      accessorKey: 'regenerated_at',
      header: () => 'Regenerated At',
      cell: ({ row }) => 
        row.getValue('regenerated_at')
          ? formatDateTimeWIB(row.getValue('regenerated_at'))
          : <Minus className="size-4 text-zinc-300" />,
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
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button onClick={() => navigator.clipboard.writeText(row.original.key)}>
                  Copy Secret Key
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-base hover:cursor-pointer">
                <Link href={`/secret-key/${row.original.id}/regenerate`}>Regenerate</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5" />
              <DropdownMenuItem
                className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                asChild
              >
                <button
                  onClick={() => {
                    setDeleteData({ id: row.original.id, appName: row.getValue('app_name') });
                    setIsOpenDeleteDialog(true);
                  }}
                >
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [secretKeys]);
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

      {secretKeys.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {secretKeys.length} {secretKeys.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DeleteDialog
        onDelete={handleDelete}
        isOpenDeleteDialog={isOpenDeleteDialog}
        setIsOpenDeleteDialog={setIsOpenDeleteDialog}
        deleteData={deleteData}
        setDeleteData={setDeleteData}
      />
    </>
  );
}
