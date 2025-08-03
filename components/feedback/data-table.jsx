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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { formatDateTimeWIB } from '@/lib/format-date';
import { getTableHeaderWidth } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import SelectionAlert from '../ui/selection-alert';
import { Minus } from 'lucide-react';
import DetailDialog from './detail-dialog';

export default function DataTable({
  feedbacks,
  tableState,
  tableHandler,
}) {
  const {onRowSelectionChange, onColumnVisibilityChange, onEditReadStatus} = tableHandler;
  const {rowSelection, columnVisibility} = tableState;
  const [detailData, setDetailData] = useState(null);
  const [isOpenDetailDialog, setIsOpenDetailDialog] = useState(false);

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
      cell: ({ row }) => 
        row.getValue('message').length > 50
          ? `${row.getValue('message').substring(0, 50).trimEnd()}...`
          : row.getValue('message')
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
              disabled={row.original.is_read}
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
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    onRowSelectionChange,
    onColumnVisibilityChange,
  });

  function getTableCellClassNames(columnId, isRead) {
    switch (columnId) {
      case 'actions':
        return 'text-right';

      case 'user_info':
      case 'message':
      case 'created_at':
      case 'updated_at':
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
                  className={row.original.is_read ? 'bg-muted/80' : ''}
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

      <DetailDialog
        isOpen={isOpenDetailDialog}
        onIsOpenChange={setIsOpenDetailDialog}
        detailData={detailData}
        onDetailDataChange={setIsOpenDetailDialog}
      />
    </>
  );
}
