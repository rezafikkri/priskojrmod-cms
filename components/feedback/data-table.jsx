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
import { useState } from 'react';
import { cn, getTableHeaderWidth } from '@/lib/utils';
import SelectionAlert from '../ui/selection-alert';
import DetailDialog from './detail-dialog';

export default function DataTable({
  feedbacks,
  table,
  markingAsReadIds,
  onEditReadStatus,
}) {
  const [detailData, setDetailData] = useState(null);
  const [isOpenDetailDialog, setIsOpenDetailDialog] = useState(false);

  function getTableCellClassNames(columnId, isRead) {
    switch (columnId) {
      case 'actions':
        return 'text-right';

      case 'user_info':
      case 'message':
      case 'created_at':
        return `${!isRead ? 'font-semibold' : 'text-zinc-800 dark:text-zinc-300'} hover:cursor-pointer`;

      default:
        return '';
    }
  }

  function handleOpenDetailDialog(columnId, row) {
    if (columnId !== 'actions' && columnId !== 'select') {
      setDetailData({
        name: row.original.name,
        email: row.original.email,
        message: row.getValue('message'),
        created_at: row.getValue('created_at'),
      });
      setIsOpenDetailDialog(true);

      onEditReadStatus(row.original.id, row.original.is_read);
    }
  }

  return (
    <>
      <SelectionAlert table={table} />

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
                    row.original.is_read && 'bg-muted/80',
                    markingAsReadIds.includes(row.original.id) && 'opacity-50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`p-3 ${getTableCellClassNames(cell.column.id, row.original.is_read)}`}
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

      {feedbacks.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {feedbacks.length} {feedbacks.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DetailDialog
        isOpen={isOpenDetailDialog}
        onIsOpenChange={setIsOpenDetailDialog}
        detailData={detailData}
        onDetailDataChange={setIsOpenDetailDialog}
      />
    </>
  );
}
