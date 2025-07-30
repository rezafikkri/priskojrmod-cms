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
import { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { formatDateTimeWIB } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import SelectionAlert from '../ui/selection-alert';
import { Minus } from 'lucide-react';

export default function DataTable({
  feedbacks,
  tableState,
  tableHandler,
}) {
  const { onRowSelectionChange } = tableHandler;
  const { rowSelection } = tableState;

  // table definition
  const columns = useMemo(() => [
    {
      id: 'select',
      enableSorting: false,
      header: ({ table }) => (
        <div className="flex items-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="shadow-none bg-background"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="shadow-none bg-background"
          />
        </div>
      ),
    },
    {
      accessorKey: 'user_info',
      header: 'User Info',
      cell: ({ row }) => 
        row.getValue('user_info') ?? <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="overflow-hidden text-ellipsis">{
          row.getValue('message').length > 70
            ? `${row.getValue('message').substring(0, 70)}...`
            : row.getValue('message')
        }</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('created_at')),
    },
    {
      accessorKey: 'updated_at',
      header: () => 'Updated At',
      cell: ({ row }) => formatDateTimeWIB(row.getValue('updated_at')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus-visible:ring-ring"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="w-full text-base"
              asChild
            >
              <button>
                Mark as Read
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);
  const table = useReactTable({
    data: feedbacks,
    columns,
    state: {
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    onRowSelectionChange,
  });

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

      {feedbacks.length > 0 && (
        <p className="text-muted-foreground mt-4">
          {feedbacks.length} {feedbacks.length === 1 ? 'result' : 'results'}
        </p>
      )}
    </>
  );
}
