'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isLastPage, getStatusClasses } from '@/lib/utils';
import { RotateCw, Minus } from 'lucide-react';
import InfoCircle from '../icon/info-circle';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { safeFetch } from '@/lib/safe-fetch';
import {
  editTransactionStatus,
  fixTransactionStatus,
  prepareConfirmationMessage,
} from '@/actions/transaction-actions';
import { TransactionStatus } from '@/constants/enums';
import ExportCSV from './export-csv';
import TablePagination from '../ui/table-pagination';
import DataTable from '../ui/data-table';
import { localStorageGet } from '@/lib/local-storage';
import TableColumnVisibility from '../ui/table-column-visibility';
import CorrectStatusDialog from './correct-status-dialog';
import DetailsSheet from './details-sheet';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-currency';
import { formatDateTime } from '@/lib/format-date';
import { cmsConfig } from '@/config/cms';
import SearchInput from '../ui/search-input';
import RefundConfirmDialog from './refund-confirm-dialog';
import RefundDeadlineDialog from './refund-deadline-dialog';
import CancelConfirmDialog from './cancel-confirm-dialog';
import RefundFormDialog from './refund-form-dialog';
import { useDialog } from '@/hooks/use-dialog';
import { useCheckQueryStale } from '@/hooks/use-check-query-stale';
import { deepEqual } from 'fast-equals';
import TableErrorAlert from '../ui/table-error-alert';
import { useStableTopLoader } from '@/hooks/use-stable-top-loader';
import { useFetchAction } from '@/hooks/use-fetch-action';
import TableActionDropdown from '../ui/table-action-dropdown';
import { changeToLastValidPage } from '@/lib/data-table';
import TableTwoLineCell from '../ui/table-two-line-cell';

const defaultColumnVisibility = {
  admin: true,
  createdAt: true,
  paidAt: false,
  refundedAt: false,
  updatedAt: false,
};
const STALE_TIME = 1000 * 20;

export default function TransactionsTable() {
  const queryClient = useQueryClient();
  const isQueryStale = useCheckQueryStale();
  const { start: startProgress, done: doneProgress } = useStableTopLoader();

  // Temporarily hides the top progress bar for refetch after a table action (e.g. update, delete)
  const suppressProgressBarRef = useRef(false);

  // search state
  const [searchKey, setSearchKey] = useState(null);
  const hasSearched = !!searchKey;

  // filters state
  const [filters, setFilters] = useState(null);
  // Tracks user-triggered refetches.
  // Controls progress bar visibility and disables related UI buttons while fetching.
  // 'refresh' | 'search' | 'clear-search' | 'filter' | 'paginate' | null (null = no toast shown)
  const { fetchAction, updateFetchAction, fetchActionRef } = useFetchAction();

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: cmsConfig.pagination.pageSize,
  });
  function handlePaginationChange(updater) {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    const isStale = isQueryStale(['transactions', newPagination, filters, searchKey], STALE_TIME);

    if (isStale) {
      updateFetchAction('paginate');
    }
    setPagination(newPagination);
  }
  const columnVisibilityStorageKey = 'transactions:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() =>
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility
  );

  // dialog state
  const {
    data: correctData,
    isOpen: isOpenCorrectStatusDialog,
    open: openCorrectStatusDialog,
    close: closeCorrectStatusDialog,
  } = useDialog();    
  
  const {
    data: refundDeadlineData,
    isOpen: isOpenRefundDeadlineDialog,
    open: openRefundDeadlineDialog,
    close: closeRefundDeadlineDialog,
  } = useDialog();

  const {
    data: cancelData,
    isOpen: isOpenCancelConfirmDialog,
    open: openCancelConfirmDialog,
    close: closeCancelConfirmDialog,
  } = useDialog();

  const [seeDetailsId, setSeeDetailsId] = useState(null);
  
  const [refundData, setRefundData] = useState(null);
  const [isOpenRefundFormDialog, setIsOpenRefundFormDialog] = useState(false);
  const [isOpenRefundConfirmDialog, setIsOpenRefundConfirmDialog] = useState(false);

  // updating ids state
  const [updatingTransactionStatusIds, setUpdatingTransactionStatusIds] = useState([]);
  const [correctingTransactionStatusIds, setCorrectingTransactionStatusIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all updating or correcting succeed.
  const hasSuccessfulUpdateStatusRef = useRef(false);
  const hasSuccessfulCorrectStatusRef = useRef(false);

  // For track pending IDs to avoid repeated refetches when multiple actions run at once.
  // Refetch triggers only once after a success, keeping pages in sync.
  const updatingTransactionStatusIdsRef = useRef(updatingTransactionStatusIds);
  const correctingTransactionStatusIdsRef = useRef(correctingTransactionStatusIds);

  // add status filters
  function addParamsToURL(url, { filters, pagination, searchKey }) {
    let newUrl = url + `?pi=${pagination.pageIndex}`;

    // add search param to url
    if (searchKey) {
      newUrl += `&sk=${searchKey}`;
    }
    
    if (filters?.status && filters.status !== 'all') {
      newUrl += `&ts=${filters.status}`;
    }

    return newUrl;
  }

  const {
    data: dataT,
    isPending: isPendingT,
    isRefetching: isRefetchingT,
    isError: isErrorT,
    error: errorT,
    isPlaceholderData: isPlaceholderDataT,
  } = useQuery({
    queryKey: ['transactions', pagination, filters, searchKey],
    queryFn: async ({ signal }) => {
      try {
        const results = await safeFetch({
          url: addParamsToURL('/api/transactions', { pagination, filters, searchKey }),
          signal,
        });
        return results?.data;       
      } catch (err) {
        if (suppressProgressBarRef.current && !fetchActionRef.current) {
          err.silent = true;
        }
        throw err;
      }
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });

  // manage toast loading
  useEffect(() => {
    if (isRefetchingT && (!suppressProgressBarRef.current || fetchAction)) {
      startProgress();
    } else if (!isRefetchingT) {
      doneProgress();

      // reset fetchAction
      updateFetchAction(null);
    }
  }, [isRefetchingT, fetchAction, startProgress, doneProgress]);

  async function handleSearch(key) {
    const keyResult = searchKeySchema.safeParse(key);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;

    const queryKey = ['transactions', pagination, filters, parsedKey];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      updateFetchAction('search');

      if (searchKey === parsedKey) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }

    setPagination({ ...pagination, pageIndex: 0 });
    setSearchKey(parsedKey);
  }

  function handleEnterSearch(e) {
    if (e.key === 'Enter') {
      handleSearch(e.target.value);
    }
  }

  function handleClearSearchInput() {
    const isStale = isQueryStale(
      ['transactions', { ...pagination, pageIndex: 0 }, filters, null],
      STALE_TIME,
    );

    if (isStale) {
      updateFetchAction('clear-search');
    }

    setPagination({ ...pagination, pageIndex: 0 });
    setSearchKey(null);
  }

  async function handleRefresh() {
    updateFetchAction('refresh');
    let lastPageIndex = 0;

    if (pagination.pageIndex !== 0) {
      const transaction = queryClient.getQueryData(['transactions', pagination, filters, searchKey]);

      if (transaction) {
        lastPageIndex = Math.ceil(transaction.rowCount / cmsConfig.pagination.pageSize) - 1;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactionDetails'] });

    if (pagination.pageIndex === 0) return;

    const transaction = queryClient.getQueryData(['transactions', pagination, filters, searchKey]);
    if (transaction) {
      changeToLastValidPage({
        rowCount: transaction.rowCount,
        pagination,
        searchKey,
        filters,
        updateFetchAction,
        queryClient,
        baseQueryKey: 'transactions',
        setPagination,
        lastPageIndex,
      });
    }
  }

  function handleFilter(newFilters) {
    const queryKey = ['transactions', pagination, newFilters, searchKey];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      updateFetchAction('filter');

      if (deepEqual(filters, newFilters) && pagination.pageIndex === 0) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }
    
    setPagination({ ...pagination, pageIndex: 0 });
    // set filters for trigger refetch
    setFilters(newFilters);
  }

  function applyStatusUpdate({ transaction, status, editData }) {
    const result = {
      ...transaction,
      status,
      updatedAt: editData.updatedAt,
    };
    
    if (status === TransactionStatus.PAID) {
      result.invoices = editData.invoices;

      if (editData.paidAt) {
        result.paidAt = editData.paidAt;
      }
    }

    if (status === TransactionStatus.REFUND) {
      result.refundedAt = editData.refundedAt;
    }

    return result;
  }

  const handleEditTransactionStatus = useCallback(async ({ id, status, refundNote }) => {
    setUpdatingTransactionStatusIds((prev) => {
      const newIds = [...prev, id];
      updatingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });
    const toastId = toast.loading(`Changing status to ${status}...`);

    const editRes = await editTransactionStatus({ id, status, refundNote });

    setUpdatingTransactionStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      updatingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const transaction = queryClient.getQueryData(['transactions', pagination, filters, searchKey]);
    const newTransactions = transaction?.items?.filter(t => t.id !== id);

    if (editRes.status === 'success') {
      if (!filters?.status || filters.status === 'all') {
        if (pagination.pageIndex === 0) {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;

              const targetTransaction = oldData.items.find(t => t.id === id);
              if (!targetTransaction) return oldData;

              return {
                ...oldData,
                items: [
                  applyStatusUpdate({
                    transaction: targetTransaction,
                    status,
                    editData: editRes.data,
                  }),
                  ...oldData.items.filter(t => t.id !== id),
                ],
              };
            },
          );
        } else if (newTransactions?.length === 0) {
          updateFetchAction('paginate');
          setPagination((pagination) => ({
            ...pagination,
            pageIndex: pagination.pageIndex - 1,
          }));
        } else {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                items: oldData.items.filter(t => t.id !== id),
              };
            },
          );

          hasSuccessfulUpdateStatusRef.current = true;
        }

        if (pagination.pageIndex === 0 || newTransactions?.length === 0) {
          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      } else if (transaction) {
        const newRowCount = transaction.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: transaction.rowCount,
        })) {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            { items: newTransactions, rowCount: newRowCount },
          );

          hasSuccessfulUpdateStatusRef.current = true;
        } else {
          if (newTransactions.length === 0 && newRowCount > 0) {
            const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

            queryClient.setQueryData(
              ['transactions', newPagination, filters, searchKey],
              (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, rowCount: newRowCount };
              },
            );

            // change page to prev page
            updateFetchAction('paginate');
            setPagination(newPagination);

            queryClient.removeQueries({
              queryKey: ['transactions', pagination, filters, searchKey],
              exact: true,
            });
          } else {
            queryClient.setQueryData(
              ['transactions', pagination, filters, searchKey],
              { items: newTransactions, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
      }

      queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 
      toast.success(editRes.message, { id: toastId });
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (updatingTransactionStatusIdsRef.current.length === 0 && hasSuccessfulUpdateStatusRef.current) {
      hasSuccessfulUpdateStatusRef.current = false;

      const hasNoFilter = !filters?.status || filters.status === 'all';
      const shouldInvalidate = hasNoFilter
        ? pagination.pageIndex !== 0 && newTransactions?.length !== 0
        : transaction && !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: transaction.rowCount,
        });

      if (shouldInvalidate) {
        suppressProgressBarRef.current = true;
        await queryClient.invalidateQueries({ queryKey: ['transactions'] });
        suppressProgressBarRef.current = false;
      }
    }
  }, [pagination, filters, searchKey]);

  const handleCopyableMessage = useCallback(async (id) => {
    const toastId = toast.loading('Preparing the message...');

    const prepareRes = await prepareConfirmationMessage(id);
    navigator.clipboard.writeText(prepareRes.data.message);

    toast.success('Message copied to clipboard.', { id: toastId });
  }, []);

  function applyStatusCorrection({ transaction, newStatus, currentStatus, editData }) {
    const result = {
      ...transaction,
      status: newStatus,
      updatedAt: editData.updatedAt,
    };
    if (newStatus === TransactionStatus.PAID) {
      result.invoices = editData.invoices;

      if (editData.paidAt) {
        result.paidAt = editData.paidAt;
      }

      if (currentStatus === TransactionStatus.REFUND) {
        result.refundedAt = null;
      }
    }

    if (newStatus === TransactionStatus.CANCELLED) {
      result.paidAt = null;
    }

    return result;
  }

  async function handleFixTransactionStatus({ id, newStatus, currentStatus }) {
    //show loading
    const toastId = toast.loading(`Correcting status to ${newStatus}...`);

    setCorrectingTransactionStatusIds((prev) => {
      const newIds = [...prev, id];
      correctingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const fixRes = await fixTransactionStatus({ id, status: newStatus });

    setCorrectingTransactionStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      correctingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const transaction = queryClient.getQueryData(['transactions', pagination, filters, searchKey]);
    const newTransactions = transaction?.items?.filter(t => t.id !== id);

    if (fixRes.status === 'success') {
      if (!filters?.status || filters?.status === 'all') {
        if (pagination.pageIndex === 0) {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;
              
              const targetTransaction = oldData.items.find(t => t.id === id);
              if (!targetTransaction) return oldData;

              return {
                ...oldData,
                items: [
                  applyStatusCorrection({
                    transaction: targetTransaction,
                    newStatus,
                    currentStatus,
                    editData: fixRes.data,
                  }),
                  ...oldData.items.filter(t => t.id !== id),
                ],
              };
            },
          );
        } else if (newTransactions?.length === 0) {
          updateFetchAction('paginate');
          setPagination((pagination) => ({
            ...pagination,
            pageIndex: pagination.pageIndex - 1,
          }));
        } else {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                items: oldData.items.filter(t => t.id !== id),
              };
            },
          );
          
          hasSuccessfulCorrectStatusRef.current = true;
        }

        if (pagination.pageIndex === 0 || newTransactions?.length === 0) {
          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      } else if (transaction) {
        const newRowCount = transaction.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: transaction.rowCount,
        })) {
          queryClient.setQueryData(
            ['transactions', pagination, filters, searchKey],
            { items: newTransactions, rowCount: newRowCount },
          );

          hasSuccessfulCorrectStatusRef.current = true;
        } else {
          if (newTransactions.length === 0 && newRowCount > 0) {
            const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

            queryClient.setQueryData(
              ['transactions', newPagination, filters, searchKey],
              (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, rowCount: newRowCount };
              },
            );

            // change page to prev page
            updateFetchAction('paginate');
            setPagination(newPagination);

            queryClient.removeQueries({
              queryKey: ['transactions', pagination, filters, searchKey],
              exact: true,
            });
          } else {
            queryClient.setQueryData(
              ['transactions', pagination, filters, searchKey],
              { items: newTransactions, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
      }

      queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 
      toast.success(fixRes.message, { id: toastId });
    } else {
      toast.error(fixRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (
      correctingTransactionStatusIdsRef.current.length === 0 &&
      hasSuccessfulCorrectStatusRef.current
    ) {
      hasSuccessfulCorrectStatusRef.current = false;

      const hasNoFilter = !filters?.status || filters.status === 'all';
      const shouldInvalidate = hasNoFilter
        ? pagination.pageIndex !== 0 && newTransactions?.length !== 0
        : transaction && !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: transaction.rowCount,
        });

      if (shouldInvalidate) {
        suppressProgressBarRef.current = true;
        await queryClient.invalidateQueries({ queryKey: ['transactions'] });
        suppressProgressBarRef.current = false;
      }
    }
  }

  // TABLE definition
  const getChangeStatusMenu = useCallback((currentStatus) => {
    if (
      currentStatus === TransactionStatus.CANCELLED ||
      currentStatus === TransactionStatus.REFUND
    ) return [];

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
  }, []);

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
      id: 'customer',
      header: 'Customer',
      enableHiding: false,
      cell: ({ row }) => (
        <TableTwoLineCell
          primary={row.original.customerName}
          secondary={row.original.customerEmail}
        />
      ),
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => (
        <TableTwoLineCell
          primary={row.original.adminName}
          secondary={row.original.adminEmail}
        />
      ),
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
      accessorKey: 'totalAmount',
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
          {formatCurrency({
            value: row.getValue('totalAmount'),
            currencyCode: row.original.currencyCode,
          })}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      accessorKey: 'paidAt',
      header: () => 'Paid At',
      cell: ({ row }) => 
        row.getValue('paidAt')
          ? formatDateTime(row.getValue('paidAt'))
          : <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'refundedAt',
      header: () => 'Refunded At',
      cell: ({ row }) => 
        row.getValue('refundedAt')
          ? formatDateTime(row.getValue('refundedAt'))
          : <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'updatedAt',
      header: () => 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updatedAt')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const changeStatusMenus = getChangeStatusMenu(row.getValue('status'));
        return (
          <TableActionDropdown
            disabled={
              updatingTransactionStatusIds.includes(row.original.id) ||
              correctingTransactionStatusIds.includes(row.original.id)
            }
          >
            {changeStatusMenus.length > 0 && (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-[15px]">
                  Change status to
                </DropdownMenuLabel>
                {changeStatusMenus.map(cs => (
                  <DropdownMenuItem key={cs} className="w-full text-base" asChild>
                    <button onClick={() => {
                      if (cs === TransactionStatus.REFUND) {
                        let newRefundData = {
                          id: row.original.id,
                          transactionCode: row.getValue('code'),
                          email: row.original.customerEmail,
                        };

                        if (!row.original.customerId || row.original.customer.isBanned) {
                          setIsOpenRefundConfirmDialog(true);
                          newRefundData.customerId = row.original.customerId;
                        } else {
                          setIsOpenRefundFormDialog(true);
                        }

                        setRefundData(newRefundData);
                      } else if (cs === TransactionStatus.CANCELLED) {
                        openCancelConfirmDialog({
                          id: row.original.id,
                          transactionCode: row.getValue('code'),
                          email: row.original.customerEmail,
                        });
                      } else {
                        handleEditTransactionStatus({ id: row.original.id, status: cs });
                      }
                    }}>
                      {cs.replace(/^./, (match) => match.toUpperCase())}
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuLabel className="text-muted-foreground text-[15px]">
              Other action
            </DropdownMenuLabel>
            {row.getValue('status') !== TransactionStatus.PENDING && (
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => openCorrectStatusDialog({
                  id: row.original.id,
                  transactionCode: row.getValue('code'),
                  email: row.original.customerEmail,
                  currentStatus: row.getValue('status'),
                })}>
                  Correct status
                </button>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="w-full text-base"
              asChild
              onClick={() => setSeeDetailsId(row.original.id)}
            >
              <button>See details</button>
            </DropdownMenuItem>
            {row.original.invoices.length > 0 && (
              <DropdownMenuItem asChild className="text-base w-full py-2 hover:cursor-pointer">
                <button
                  onClick={() =>
                    window.open(`/invoice/${row.original.invoices[0].invoiceNumber}/pdf`, '_blank')
                  }
                >
                  View invoice
                </button>
              </DropdownMenuItem>
            )}
            {row.getValue('status') === TransactionStatus.PAID && (
              <>
                <DropdownMenuItem className="w-full text-base" asChild>
                  <button onClick={() => handleCopyableMessage(row.original.id)}>
                    Copy confirmation message
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full text-base" asChild>
                  <button onClick={() => openRefundDeadlineDialog({
                    transactionCode: row.getValue('code'),
                    email: row.original.customerEmail,
                    paidAt: row.getValue('paidAt'),
                  })}>
                    Check refund deadline
                  </button>
                </DropdownMenuItem>
              </>
            )}
          </TableActionDropdown>
        );
      },
    },
  ], [
    updatingTransactionStatusIds,
    correctingTransactionStatusIds,
    handleEditTransactionStatus,
    handleCopyableMessage,
    openCorrectStatusDialog,
    openRefundDeadlineDialog,
    openCancelConfirmDialog,
  ]);

  const defaultData = useMemo(() => [], []);
  const table = useReactTable({
    data: dataT?.items ?? defaultData,
    rowCount: dataT?.rowCount,
    columns,
    state: {
      columnVisibility,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex space-x-3">
          <TooltipWrapper text="Refresh">
            <Button
              variant="outline"
              className="text-base px-3 py-1.5 h-auto inline-block"
              disabled={isPendingT || fetchAction === 'refresh'}
              onClick={handleRefresh}
            >
              <RotateCw className="icon" />
            </Button>
          </TooltipWrapper>
          <FiltersPopover
            onFilter={handleFilter}
            filters={filters}
            disabled={isPendingT || fetchAction === 'filter'}
          />
          <ExportCSV filters={filters} searchKey={searchKey} />
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <SearchInput
            className="flex-1"
            placeholder="Search with transaction code..."
            disabled={isPendingT || fetchAction === 'search'}
            hasSearched={hasSearched}
            onEnterSearch={handleEnterSearch}
            onClearSearch={handleClearSearchInput}
            onSearch={handleSearch}
          />

          <TableColumnVisibility
            table={table}
            defaultColumnVisibility={defaultColumnVisibility}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            storageKey={columnVisibilityStorageKey}
          />
        </div>
      </div>

      {isPendingT
        ? <TablePaginationSkeleton />
        : (
          <>
            <TableErrorAlert
              isError={isErrorT}
              message={errorT?.message}
              isSilent={errorT?.silent}
            />
            <DataTable table={table} />
            <TablePagination
              data={dataT}
              table={table}
              pagination={pagination}
              isPlaceholderData={isPlaceholderDataT}
            />
          </>
        )}

      <p className="mt-5 text-muted-foreground text-sm"><b>Note</b>: Totals shown do not include tax</p>

      <CorrectStatusDialog
        onCorrect={handleFixTransactionStatus}
        isOpen={isOpenCorrectStatusDialog}
        onClose={closeCorrectStatusDialog}
        correctData={correctData}
      />

      <DetailsSheet detailsId={seeDetailsId} onDetailsIdChange={setSeeDetailsId} />

      <RefundConfirmDialog
        onContinue={setIsOpenRefundFormDialog}
        isOpen={isOpenRefundConfirmDialog}
        onIsOpenChange={setIsOpenRefundConfirmDialog}
        onRefundDataChange={setRefundData}
        refundData={refundData}
      />

      <RefundFormDialog
        onRefund={handleEditTransactionStatus}
        isOpen={isOpenRefundFormDialog}
        onIsOpenChange={setIsOpenRefundFormDialog}
        onRefundDataChange={setRefundData}
        refundData={refundData}
      />

      <RefundDeadlineDialog
        isOpen={isOpenRefundDeadlineDialog}
        onClose={closeRefundDeadlineDialog}
        refundDeadlineData={refundDeadlineData}
      />

      <CancelConfirmDialog
        onCancel={handleEditTransactionStatus}
        isOpen={isOpenCancelConfirmDialog}
        onClose={closeCancelConfirmDialog}
        cancelData={cancelData}
      />
    </>
  );
}
