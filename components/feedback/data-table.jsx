'use client';

import { flexRender } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, getTableHeaderWidth } from '@/lib/utils';

export default function DataTable({
  table,
  onOpenDetailDialog,
  onEditReadStatus,
}) {
  function getTableCellClassNames(columnId, isRead) {
    switch (columnId) {
      case 'actions':
        return 'text-right';

      case 'userInfo':
      case 'message':
      case 'createdAt':
        return `${!isRead ? 'font-semibold' : 'text-zinc-800 dark:text-zinc-300'} hover:cursor-pointer`;

      default:
        return '';
    }
  }

  function handleOpenDetailDialog(columnId, row) {
    if (columnId !== 'actions' && columnId !== 'select') {
      onOpenDetailDialog({
        name: row.original.name,
        email: row.original.email,
        message: row.getValue('message'),
        createdAt: row.getValue('createdAt'),
      });

      onEditReadStatus(row.original.id, row.original.isRead);
    }
  }

  return (
    <div className="rounded-md border">
      <Table className="text-base">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`px-3 py-2.5 text-zinc-600 dark:text-zinc-400 h-auto ${getTableHeaderWidth(header.id)} ${header.id === 'actions' ? 'text-right' : ''}`}
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
                data-state={row.getIsSelected() && 'selected'}
                className={cn(
                  row.original.isRead && 'bg-muted/80',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`p-3 ${getTableCellClassNames(cell.column.id, row.original.isRead)}`}
                    onClick={() => handleOpenDetailDialog(cell.column.id, row)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
