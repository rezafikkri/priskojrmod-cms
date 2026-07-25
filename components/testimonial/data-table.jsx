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
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format-date';
import { getTableHeaderWidth, extractSmIdentifier } from '@/lib/utils';
import ProfileBadge from '../ui/profile-badge';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableResultCount from '../ui/table-result-count';

export default function DataTable({ testimonials: data }) {
  const [testimonials] = useState(data);

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
      accessorKey: 'smProfileUrl',
      header: 'Social Media',
      cell: ({ row }) => (
        <a
          href={row.getValue('smProfileUrl')}
          rel="noopener noreferrer"
          target="_blank"
          className="underline hover:no-underline"
        >
          {extractSmIdentifier(row.getValue('smProfileUrl'))}
        </a>
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
      cell: ({ row }) => (
        <TableActionDropdown>
          <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
            <Link href={`/testimonial/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        </TableActionDropdown>
      ),
    }
  ], []);

  const table = useReactTable({
    data: testimonials,
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`p-3 ${cell.column.id === 'actions' ? 'text-right' : ''}`}
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

      <TableResultCount data={testimonials} />
    </>
  );
}
