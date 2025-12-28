'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isLastPage, getStatusClasses } from '@/lib/utils';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, RotateCw, MoreHorizontal } from 'lucide-react';
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
import Link from 'next/link';
import { cmsConfig } from '@/config/cms';
import SearchInput from '../ui/search-input';

const defaultColumnVisibility = {
  created_at: true,
  updated_at: false,
};

export default function TransactionsTable() {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [searchedTransaction, setSearchedTransaction] = useState(null);
  const searchRef = useRef(null);

  // filters state
  const [filters, setFilters] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // determine show table skeleton or not in normal mode
  const shouldShowSkeletonLoading = useRef(true);

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: cmsConfig.pagination.pageSize,
  });
  function handlePaginationChange(pagination) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
    setPagination(pagination);
  }
  const columnVisibilityStorageKey = 'transactions:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() =>
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility
  );

  // correct status and see details dialog state
  const [correctData, setCorrectData] = useState(null);
  const [isOpenCorrectStatusDialog, setIsOpenCorrectStatusDialog] = useState(false);
  const [seeDetailsId, setSeeDetailsId] = useState(null);

  // updating ids state
  const [updatingTransactionStatusIds, setUpdatingTransactionStatusIds] = useState([]);
  const [correctingTransactionStatusIds, setCorrectingTransactionStatusIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all updating or correcting succeed.
  const hasSuccessfulUpdateStatusRef = useRef(false);
  const hasSuccessfulCorrectStatusRef = useRef(false);

  // This `useRef` is here to **always keep the newest `searchedTransaction and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedTransaction and more state` value, which is called a "stale closure" problem.
  const searchedTransactionRef = useRef(searchedTransaction);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const updatingTransactionStatusIdsRef = useRef(updatingTransactionStatusIds);
  const correctingTransactionStatusIdsRef = useRef(correctingTransactionStatusIds);

  useEffect(() => {
    searchedTransactionRef.current = searchedTransaction;
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [searchedTransaction, filters, pagination]);

  // add status filters
  function addFiltersToURL(url, appliedFilters) {
    if (!appliedFilters) return url;

    let newUrl = url;
    if (appliedFilters.status && appliedFilters.status !== 'all') {
      newUrl += `&ts=${appliedFilters.status}`;
    }

    return newUrl;
  }

  const {
    data: dataT,
    isFetching: isFetchingT,
    isError: isErrorT,
    error: errorT,
    isPlaceholderData: isPlaceholderDataT,
  } = useQuery({
    queryKey: ['transactions', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      if (!shouldShowSkeletonLoading.current) {
        toastId = toast.loading('Loading transactions...');
      }

      const results = await safeFetch({
        url: addFiltersToURL(`/api/transactions?pi=${pagination.pageIndex}`, filters),
        onFinally: () => {
          if (toastId) {
            toast.dismiss(toastId);
          }
        },
      });
      return results.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 3,
    enabled: !searchedTransaction,
  });

  async function handleSearch(appliedFilters) {
    const keyResult = searchKeySchema.safeParse(searchRef.current.value);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['transactionsSearch', parsedKey, appliedFilters],
        queryFn: async () => {
          setIsSearching(true);
          // if previoesly searchedTransaction is null, then show skeleton loading
          // for all table, besides that, then show toast loading only
          let toastId;
          if (searchedTransaction) {
            toastId = toast.loading('Searching transactions...');
          }

          return await safeFetch({
            url: addFiltersToURL(`/api/transactions?sk=${parsedKey}`, appliedFilters),
            onFinally: () => {
              if (toastId) {
                toast.dismiss(toastId);
              }
              setIsSearching(false);
            },
            errorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 10_000,
        gcTime: 10_000,
      });

      setSearchedTransaction(result.data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEnterSearch(e) {
    if (e.key === 'Enter') {
      handleSearch(filters);
    }
  }

  function handleClearSearchInput() {
    handlePaginationChange({
      ...pagination,
      pageIndex: 0,
    });
    setSearchedTransaction(null);
    searchRef.current.value = '';
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters) {
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }
  }

  function handleFilter(newFilters) {
    if (searchedTransaction) {
      handleSearch(newFilters);
    } else {
      handlePaginationChange({
        ...pagination,
        pageIndex: 0,
      });
    }

    // set filters for trigger refetch in normal mode
    setFilters(newFilters);
    syncIsFilterActive(newFilters);
  }

  function handleRefresh() {
    // not show table skeleton loading
    if (!searchedTransaction) {
      shouldShowSkeletonLoading.current = false;
    }
    
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactionsSearch'] });
    queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 

    if (searchedTransaction) {
      handleSearch(filters);
    }
  }

  const handleEditTransactionStatus = useCallback(async (id, status) => {
    // not show table skeleton loading
    if (!searchedTransaction) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to updated row
    setUpdatingTransactionStatusIds((prev) => {
      const newIds = [...prev, id];
      updatingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });
    const toastId = toast.loading(`Changing status to ${status}...`);

    const editRes = await editTransactionStatus({ id, status });

    setUpdatingTransactionStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      updatingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const transaction = queryClient.getQueryData([
      'transactions',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (editRes.status === 'success') {
      if (searchedTransactionRef.current) {
        setSearchedTransaction(prevTransaction => {
          let newTransactions;

          if (!filtersRef.current?.status || filtersRef.current?.status === 'all') {
            newTransactions = prevTransaction.items.map(transaction => {
              if (transaction.id === id) {
                const result = {
                  ...transaction,
                  status,
                  updated_at: editRes.data.updated_at,
                };
                if (status === TransactionStatus.PAID) {
                  result.invoices = editRes.data.invoices;
                }

                return result;
              }
              return transaction;
            });
          } else {
            newTransactions = prevTransaction.items.filter(t => t.id !== id);
          }

          return {
            ...prevTransaction,
            items: newTransactions,
          };
        });

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else if (!filtersRef.current?.status || filtersRef.current?.status === 'all') {
        if (paginationRef.current.pageIndex === 0) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;
              
              const targetTransaction = oldData.items.find(t => t.id === id);

              if (targetTransaction) {
                const newTargetTransaction = {
                  ...targetTransaction,
                  status,
                  updated_at: editRes.data.updated_at,
                };
                if (status === TransactionStatus.PAID) {
                  newTargetTransaction.invoices = editRes.data.invoices;
                }

                return {
                  ...oldData,
                  items: [
                    newTargetTransaction,
                    ...oldData.items.filter(t => t.id !== id),
                  ],
                };
              }
              return oldData;
            },
          );

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        } else {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
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
      } else {
        const newTransactions = transaction.items.filter(t => t.id !== id);
        const newRowCount = transaction.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: transaction.rowCount,
        })) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            { items: newTransactions, rowCount: newRowCount },
          );

          hasSuccessfulUpdateStatusRef.current = true;
        } else {
          if (newTransactions.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['transactions', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['transactions', paginationRef.current.pageIndex - 1, filtersRef.current],
              (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, rowCount: newRowCount };
              },
            );

            setPagination((pagination) => ({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            }));
          } else {
            queryClient.setQueryData(
              ['transactions', paginationRef.current.pageIndex, filtersRef.current ],
              { items: newTransactions, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactionsSearch'] });
      queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 
      toast.success(editRes.message, { id: toastId });
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // For still invalidateQueries transactions, when not in last page, last update item fails, and 
    // at least one update succeeded.
    if (
      !searchedTransactionRef.current &&
      updatingTransactionStatusIdsRef.current.length === 0 &&
      hasSuccessfulUpdateStatusRef.current
    ) {
      const isStatusFilterEmpty = !filtersRef.current?.status;
      const isFilterMatched = isStatusFilterEmpty
        ? paginationRef.current.pageIndex !== 0
        : !isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: transaction.rowCount,
        });

      if (isFilterMatched) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }

      hasSuccessfulUpdateStatusRef.current = false;
    }
  }, []);

  const handleCopyableMessage = useCallback(async (id) => {
    const toastId = toast.loading('Preparing the message...');

    const prepareRes = await prepareConfirmationMessage(id);
    navigator.clipboard.writeText(prepareRes.data.message);

    toast.success('Message copied to clipboard', { id: toastId });
  }, []);

  async function handleCorrectTransactionStatus({ correctData, toastId }) {
    // not show table skeleton loading
    if (!searchedTransaction) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to updated row
    setCorrectingTransactionStatusIds((prev) => {
      const newIds = [...prev, correctData.id];
      correctingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const editRes = await fixTransactionStatus({ id: correctData.id, status: correctData.newStatus });

    setCorrectingTransactionStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== correctData.id);
      correctingTransactionStatusIdsRef.current = newIds;
      return newIds;
    });

    const transaction = queryClient.getQueryData([
      'transactions',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (editRes.status === 'success') {
      if (searchedTransactionRef.current) {
        setSearchedTransaction(prevTransaction => {
          let newTransactions;

          if (!filtersRef.current?.status || filtersRef.current?.status === 'all') {
            newTransactions = prevTransaction.items.map(transaction => {
              if (transaction.id === correctData.id) {
                const result = {
                  ...transaction,
                  status: correctData.newStatus,
                  updated_at: editRes.data.updated_at,
                };
                if (correctData.newStatus === TransactionStatus.PAID) {
                  result.invoices = editRes.data.invoices;
                }

                return result;
              }
              return transaction;
            });
          } else {
            newTransactions = prevTransaction.items.filter(t => t.id !== correctData.id);
          }

          return {
            ...prevTransaction,
            items: newTransactions,
          };
        });

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else if (!filtersRef.current?.status || filtersRef.current?.status === 'all') {
        if (paginationRef.current.pageIndex === 0) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;
              
              const targetTransaction = oldData.items.find(t => t.id === correctData.id);

              if (targetTransaction) {
                const newTargetTransaction = {
                  ...targetTransaction,
                  status: correctData.newStatus,
                  updated_at: editRes.data.updated_at,
                };
                if (correctData.newStatus === TransactionStatus.PAID) {
                  newTargetTransaction.invoices = editRes.data.invoices;
                }

                return {
                  ...oldData,
                  items: [
                    newTargetTransaction,
                    ...oldData.items.filter(t => t.id !== correctData.id),
                  ],
                };
              }
              return oldData;
            },
          );

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        } else {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                items: oldData.items.filter(t => t.id !== correctData.id),
              };
            },
          );
          
          hasSuccessfulCorrectStatusRef.current = true;
        }
      } else {
        const newTransactions = transaction.items.filter(t => t.id !== correctData.id);
        const newRowCount = transaction.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: transaction.rowCount,
        })) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            { items: newTransactions, rowCount: newRowCount },
          );

          hasSuccessfulCorrectStatusRef.current = true;
        } else {
          if (newTransactions.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['transactions', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['transactions', paginationRef.current.pageIndex - 1, filtersRef.current],
              (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, rowCount: newRowCount };
              },
            );

            setPagination((pagination) => ({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            }));
          } else {
            queryClient.setQueryData(
              ['transactions', paginationRef.current.pageIndex, filtersRef.current ],
              { items: newTransactions, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactionsSearch'] });
      queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 
      toast.success(editRes.message, { id: toastId });
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // For still invalidateQueries transactions, when not in last page, last correct item fails, and 
    // at least one correct succeeded.
    if (
      !searchedTransactionRef.current &&
      correctingTransactionStatusIdsRef.current.length === 0 &&
      hasSuccessfulCorrectStatusRef.current
    ) {
      const isStatusFilterEmpty = !filtersRef.current?.status;
      const isFilterMatched = isStatusFilterEmpty
        ? paginationRef.current.pageIndex !== 0
        : !isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: transaction.rowCount,
        });

      if (isFilterMatched) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }

      hasSuccessfulCorrectStatusRef.current = false;
    }
  }

  const hasSearched = !!searchedTransaction;
  let transaction;
  if (searchedTransaction) {
    transaction = searchedTransaction;
  } else if (dataT) {
    transaction = dataT;
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
          {formatCurrency({
            value: row.getValue('total_amount'),
            currencyCode: row.original.currency_code,
          })}
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
      cell: ({ row }) => {
        const changeStatusMenus = getChangeStatusMenu(row.getValue('status'));
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 focus-visible:ring-ring"
                disabled={
                  updatingTransactionStatusIds.includes(row.original.id) ||
                  correctingTransactionStatusIds.includes(row.original.id)
                }
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-50">
              {changeStatusMenus.length > 0 && (
                <>
                  <DropdownMenuLabel
                    className="text-muted-foreground text-[15px]"
                  >
                    Change status to
                  </DropdownMenuLabel>
                  {changeStatusMenus.map(cs => (
                    <DropdownMenuItem
                      key={cs}
                      className="w-full text-base"
                      asChild
                    >
                      <button
                        onClick={() => {
                          handleEditTransactionStatus(row.original.id, cs);
                        }}
                      >{cs.charAt(0).toUpperCase()}{cs.slice(1)}</button>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Other action</DropdownMenuLabel>

              {row.getValue('status') !== TransactionStatus.PENDING && (
                <DropdownMenuItem
                  className="w-full text-base focus:bg-orange-100 dark:focus:bg-orange-300/10"
                  asChild
                >
                  <button
                    onClick={() => {
                      setIsOpenCorrectStatusDialog(true);
                      setCorrectData({
                        id: row.original.id,
                        transactionCode: row.getValue('code'),
                        currentStatus: row.getValue('status'),
                      });
                    }}
                  >
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
                <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                  <Link
                    href={`/invoice/${row.original.invoices[0].invoice_number}/pdf`}
                    target='_blank'
                  >View invoice</Link>
                </DropdownMenuItem>
              )}

              {row.getValue('status') === TransactionStatus.PAID && (
                <DropdownMenuItem
                  className="w-full text-base"
                  asChild
                >
                  <button onClick={() => handleCopyableMessage(row.original.id)}>
                    Copy confirmation message
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [updatingTransactionStatusIds, correctingTransactionStatusIds]);
  const table = useReactTable({
    data: transaction?.items,
    rowCount: transaction?.rowCount,
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
              disabled={isFetchingT || isSearching}
              onClick={handleRefresh}
            >
              <RotateCw className="icon" />
            </Button>
          </TooltipWrapper>
          <FiltersPopover
            onFilter={handleFilter}
            isFilterActive={isFilterActive}
            disabled={isFetchingT || isSearching}
          />
          {filters?.status !== TransactionStatus.PENDING && (
            <ExportCSV filters={filters} />
          )}
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <SearchInput
            className="flex-1"
            placeholder="Search with transaction code..."
            isLoading={isFetchingT || isSearching}
            ref={searchRef}
            hasSearched={hasSearched}
            onEnterSearch={handleEnterSearch}
            onClearSearch={handleClearSearchInput}
            onSearch={() => handleSearch(filters)}
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

      {(shouldShowSkeletonLoading.current && isFetchingT) || (isSearching && !searchedTransaction) ? (
        <TablePaginationSkeleton showPagination={!isSearching} />
      ) : isErrorT ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorT.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <DataTable
            table={table}
            processingIds={[
              ...updatingTransactionStatusIds,
              ...correctingTransactionStatusIds,
            ]}
          />
          <TablePagination
            data={transaction}
            table={table}
            pagination={pagination}
            isPlaceholderData={isPlaceholderDataT}
            showNavigation={!hasSearched}
          />
        </>
      )}

      <CorrectStatusDialog
        onCorrect={handleCorrectTransactionStatus}
        isOpen={isOpenCorrectStatusDialog}
        onIsOpenChange={setIsOpenCorrectStatusDialog}
        onCorrectDataChange={setCorrectData}
        correctData={correctData}
      />

      <DetailsSheet detailsId={seeDetailsId} onDetailsIdChange={setSeeDetailsId} />
    </>
  );
}
