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
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { removeFaq } from '@/actions/faq-actions';
import Link from 'next/link';
import { Language } from '@/constants/enums';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { cmsConfig } from '@/config/cms';
import DeleteDialog from '../ui/delete-dialog';
import { useDialog } from '@/hooks/use-dialog';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableResultCount from '../ui/table-result-count';
import { callAction } from '@/lib/call-action';

export default function DataTable({ faqs: data }) {
  const [faqs, setFaqs] = useState(data);
  const [titleLang, setTitleLang] = useState(cmsConfig.defaults.language);
  const [deletingIds, setDeletingIds] = useState([]);

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
    const toastId = toast.loading('Deleting FAQ...');
    
    const removeRes = await callAction(() => removeFaq(id));

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      setFaqs((prevFaqs) => prevFaqs.filter(faq => faq.id !== id));
      toast.success('FAQ deleted successfully.', {
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
      accessorKey: `translations.title.${titleLang}`,
      header: () => (
        <>
          <span>Title</span>
          <div className="ms-4 inline-block space-x-1"> 
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${titleLang === Language.ID ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setTitleLang(Language.ID)}
            >
              ID
            </Button>
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${titleLang === Language.EN ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setTitleLang(Language.EN)}
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
          <TableActionDropdown disabled={deletingIds.includes(row.original.id)}>
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
              <Link href={`/faq/${row.original.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5" />
            <DropdownMenuItem className="w-full text-base" asChild>
              <button onClick={() => openDeleteDialog({
                id: row.original.id,
                title: row.original.translations.title[titleLang],
              })}>
                Delete
              </button>
            </DropdownMenuItem>
          </TableActionDropdown>
        );
      },
    }
  ], [titleLang, deletingIds, openDeleteDialog]);
  const table = useReactTable({
    data: faqs,
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
                      className={`p-3 ${cell.column.id === 'actions' ? 'text-right' : '' } ${cell.column.id === `translations_title_${titleLang}` ? 'whitespace-normal' : ''}`}
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

      <TableResultCount data={faqs} />

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        title="Delete FAQ"
        description={`FAQ <b>${deleteData?.title}</b> will be permanently deleted.`}
      />
    </>
  );
}
