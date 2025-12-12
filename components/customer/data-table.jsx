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
import { getTableHeaderWidth } from '@/lib/utils';
import DeleteDialog from './delete-dialog';
import { Button } from '../ui/button';

export default function DataTable({
  customer,
  pageInfo,
  table,
  tableState,
  tableHandler,
  isPlaceholderData,
  hasSearched,
}) {
  const {customers, isTooMany} = customer;
  const {
    deleteData,
    isOpenDeleteDialog,
    deletingIds,
    updatingBanStatusIds,
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
                  className={
                    (
                      deletingIds.includes(row.original.id) ||
                      updatingBanStatusIds.includes(row.original.id)
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
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {customers.length > 0 ? (
        <div className="flex max-md:flex-col max-md:items-start gap-3 md:gap-5 md:justify-between mt-4 items-center">
          <span className="text-muted-foreground">{pageInfo}</span>
          {!hasSearched ? (
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-auto text-base px-3 py-1.5"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={isPlaceholderData || !table.getCanNextPage()}
                className="h-auto text-base px-3 py-1.5"
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {(hasSearched && isTooMany) ? (
        <p className="mt-5 inline-block text-muted-foreground text-sm"><b>Info</b>: If you haven't found the customer you're looking for, please use a more specific email!</p>
      ) : null}

      <DeleteDialog
        onDelete={onDelete}
        isOpen={isOpenDeleteDialog}
        onIsOpenChange={onIsOpenDeleteDialogChange}
        onDeleteDataChange={onDeleteDataChange}
        deleteData={deleteData}
      />
    </>
  );
}
