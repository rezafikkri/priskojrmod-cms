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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { formatDateTime } from '@/lib/format-date';
import { formatCurrency, getStatusClasses, getTableHeaderWidth } from '@/lib/utils';
import TooltipWrapper from '../ui/tooltip-wrapper';
import InfoCircle from '../icon/info-circle';
import CorrectStatusDialog from './correct-status-dialog';
import DetailsSheet from './details-sheet';
import { TransactionStatus } from '@/constants/enums';
import Link from 'next/link';

export default function DataTable({
  transaction,
  pageInfo,
  tableState,
  tableHandler,
  isPlaceholderData,
  hasSearched,
}) {
  const {transactions, rowCount} = transaction;
  const {
    columnVisibility,
    pagination,
    updatingTransactionStatusIds,
  } = tableState;
  const {
    onPaginationChange,
    onColumnVisibilityChange,
    onEditTransactionStatus,
    onCopyableMessage,
  } = tableHandler;

  const [correctData, setCorrectData] = useState({
    transactionCode: 'PJM-20250814-ABC123',
  });
  const [isOpenCorrectStatusDialog, setIsOpenCorrectStatusDialog] = useState(false);

  const [seeDetailsId, setSeeDetailsId] = useState(null);

  function getChangeStatusMenu(currentStatus) {
    if (
      currentStatus === TransactionStatus.CANCELLED ||
      currentStatus === TransactionStatus.REFUND
    ) return null;

    let excludedStatuses = [
      TransactionStatus.PENDING,
      TransactionStatus.REFUND,
    ];

    if (currentStatus === TransactionStatus.PAID) {
      excludedStatuses = [
        TransactionStatus.PENDING,
        TransactionStatus.CANCELLED,
        TransactionStatus.PAID,
      ];
    }

    return Object.values(TransactionStatus).filter(ts => !excludedStatuses.includes(ts));
  }

  // table definition
  const columns = useMemo(() => [
    {
      accessorKey: 'code',
      header: () => (
        <>
          <span className="me-1">Code</span>
          <TooltipWrapper text="Transaction code">
            <span className="cursor-help"><InfoCircle /></span>
          </TooltipWrapper>
        </>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'customer_email',
      header: 'Email',
      enableHiding: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableHiding: false,
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-lg capitalize font-medium ${getStatusClasses(row.getValue('status'))}`}
        >
          {row.getValue('status')}
        </span>
      ),
    },
    {
      accessorKey: 'total_amount',
      enableHiding: false,
      header: () => (
        <>
          <span className="me-1">Total</span>
          <TooltipWrapper text="Total amount paid by customer">
            <span className="cursor-help"><InfoCircle /></span>
          </TooltipWrapper>
        </>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.getValue('total_amount'), row.original.currency_code)}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('created_at')),
    },
    {
      accessorKey: 'updated_at',
      header: () => 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updated_at')),
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
              disabled={
                updatingTransactionStatusIds.includes(row.original.id)
              }
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            {getChangeStatusMenu(row.getValue('status')) && (
              <>
                <DropdownMenuLabel
                  className="text-muted-foreground text-[15px]"
                >
                  Change Status To
                </DropdownMenuLabel>
                {getChangeStatusMenu(row.getValue('status')).map(cs => (
                  <DropdownMenuItem
                    key={cs}
                    className="w-full text-base capitalize"
                    asChild
                  >
                    <button
                      onClick={() => {
                        onEditTransactionStatus(row.original.id, cs);
                      }}
                    >{cs}</button>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Other Action</DropdownMenuLabel>

            <DropdownMenuItem
              className="w-full text-base focus:bg-orange-100 dark:focus:bg-orange-300/10"
              asChild
            >
              <button
                onClick={() => setIsOpenCorrectStatusDialog(true)}
              >
                Correct Status
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="w-full text-base"
              asChild
              onClick={() => setSeeDetailsId(row.original.id)}
            >
              <button>See Details</button>
            </DropdownMenuItem>
            
            {row.original.invoices.length > 0 && (
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link
                  href={`/invoices/${row.original.invoices[0].invoice_number}/pdf`}
                  target='_blank'
                >View Invoice</Link>
              </DropdownMenuItem>
            )}

            {row.getValue('status') === TransactionStatus.PAID && (
            <DropdownMenuItem
              className="w-full text-base"
              asChild
            >
              <button onClick={() => onCopyableMessage(row.original.id)}>
                Copy Confirmation Message
              </button>
            </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [updatingTransactionStatusIds]);
  const table = useReactTable({
    data: transactions,
    rowCount,
    columns,
    state: {
      columnVisibility,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    onColumnVisibilityChange,
    onPaginationChange,
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
                    className={`px-3 py-2.5 text-zinc-600 dark:text-zinc-400 h-auto ${getTableHeaderWidth(header.id)} ${header.id === 'actions' || header.id === 'total_amount' ? 'text-right' : ''}`}
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
                      updatingTransactionStatusIds.includes(row.original.id)
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

      {transactions.length > 0 ? (
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

      <CorrectStatusDialog
        onCorrect={() => {}}
        isOpen={isOpenCorrectStatusDialog}
        onIsOpenChange={setIsOpenCorrectStatusDialog}
        onCorrectDataChange={setCorrectData}
        correctData={correctData}
      />

      <DetailsSheet detailsId={seeDetailsId} onDetailsIdChange={setSeeDetailsId} />
    </>
  );
}
