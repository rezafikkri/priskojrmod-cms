'use client';

import {
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTableHeaderWidth } from '@/lib/utils';
import DeleteDialog from './delete-dialog';

export default function DataTable({
  products,
  table,
  tableState,
  tableHandler,
}) {
  const {
    updatingPinnedStatusIds,
    updatingPublishedIds,
    deletingIds,
    deleteData,
    isOpenDeleteDialog,
  } = tableState;
  const {
    onIsOpenDeleteDialogChange, 
    onDeleteDataChange,
    onDelete,
  } = tableHandler;

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
                  className={
                    (
                      updatingPinnedStatusIds.includes(row.original.id) ||
                      updatingPublishedIds.includes(row.original.id) ||
                      deletingIds.includes(row.original.id)
                    )
                      ? 'opacity-50'
                      : ''
                  }
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

      {products.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {products.length} {products.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <DeleteDialog
        onDelete={onDelete}
        isOpenDeleteDialog={isOpenDeleteDialog}
        onIsOpenDeleteDialogChange={onIsOpenDeleteDialogChange}
        deleteData={deleteData}
        onDeleteDataChange={onDeleteDataChange}
      />
    </>
  );
}
