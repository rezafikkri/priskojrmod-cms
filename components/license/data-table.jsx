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
import { Language } from '@/constants/enums';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { removeLicense } from '@/actions/license-actions';
import { cmsConfig } from '@/config/cms';
import DeleteDialog from '../ui/delete-dialog';
import { useDialog } from '@/hooks/use-dialog';

export default function DataTable({ licenses: data }) {
  const [licenses, setLicenses] = useState(data);
  const [nameLang, setNameLang] = useState(cmsConfig.defaults.language);
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
    setDeletingIds((prevDeletingIds) => [...prevDeletingIds, id]);
    // show loading
    const toastId = toast.loading('Deleting license...');

    const removeRes = await removeLicense(id);

    setDeletingIds((prevDeletingIds) =>
      prevDeletingIds.filter((deletingId) => deletingId !== id)
    );

    if (removeRes.status === 'success') {
      setLicenses((prevLicenses) =>
        prevLicenses.filter((license) => license.id !== id)
      );
      toast.success('License deleted successfully', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: `translations.name.${nameLang}`,
      header: () => (
        <>
          <span>Name</span>
          <div className="ms-4 inline-block space-x-1"> 
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${nameLang === Language.ID ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setNameLang(Language.ID)}
            >
              ID
            </Button>
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${nameLang === Language.EN ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setNameLang(Language.EN)}
            >
              EN
            </Button>
          </div>
        </>
      ),
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
                <Link href={`/license/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5" />
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => openDeleteDialog({
                  id: row.original.id,
                  name: row.original.translations.name[nameLang],
                })}>
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [nameLang, deletingIds, openDeleteDialog]);
  const table = useReactTable({
    data: licenses,
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

      {licenses.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {licenses.length} {licenses.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        description={`License <b>${deleteData?.name}</b> will be permanently deleted.`}
      />
    </>
  );
}
