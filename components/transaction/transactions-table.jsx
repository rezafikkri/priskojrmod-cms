'use client';

import DataTable from './data-table';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generatePageInfo, isLastPage } from '@/lib/utils';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, Search, X, Columns } from 'lucide-react';
import TablePaginationSekeleton from '../loadings/table-pagination-skeleton';
import { RotateCw } from 'lucide-react';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { safeFetch } from '@/lib/safe-fetch';
import { editTransactionStatus } from '@/actions/transaction-actions';

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
    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE,
  });
  function handlePaginationChange(pagination) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
    setPagination(pagination);
  }
  const [columnVisibility, setColumnVisibility] = useState({
    created_at: true,
    updated_at: false,
  });

  // updateing ids state
  const [updatingTransactionStatusIds, setUpdatingTransactionStatusIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or banning succeed.
  const hasSuccessfulStatusChangeRef = useRef(false);

  // This `useRef` is here to **always keep the newest `searchedTransaction and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedTransaction and more state` value, which is called a "stale closure" problem.
  const searchedTransactionRef = useRef(searchedTransaction);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const updatingTransactionStatusIdsRef = useRef(updatingTransactionStatusIds);

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
    isPlaceholderData: isPlaceholderDataC,
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

          if (filtersRef.current?.status === status || !filtersRef.current?.status) {
            newTransactions = prevTransaction.transactions.map(transaction => {
              if (transaction.id === id) {
                return {
                  ...transaction,
                  status,
                  updated_at: editRes.data.updated_at,
                };
              }
              return transaction;
            });
          } else {
            newTransactions = prevTransaction.transactions.filter(t => t.id !== id);
          }

          return {
            ...prevTransaction,
            transactions: newTransactions,
          };
        });

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else if (filtersRef.current?.status === status || !filtersRef.current?.status) {
        if (paginationRef.current.pageIndex === 0) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;
              
              const targetTransaction = oldData.transactions.find(t => t.id === id);

              if (targetTransaction) {
                return {
                  ...oldData,
                  transactions: [
                    {
                      ...targetTransaction,
                      status,
                      updated_at: editRes.data.updated_at,
                    },
                    ...oldData.transactions.filter(t => t.id !== id),
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
                transactions: oldData.transactions.filter(t => t.id !== id),
              };
            },
          );
          
          hasSuccessfulStatusChangeRef.current = true;
        }
      } else {
        const newTransactions = transaction.transactions.filter(t => t.id !== id);
        const newRowCount = transaction.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: transaction.rowCount,
        })) {
          queryClient.setQueryData(
            ['transactions', paginationRef.current.pageIndex, filtersRef.current],
            { transactions: newTransactions, rowCount: newRowCount },
          );

          hasSuccessfulStatusChangeRef.current = true;
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
              { transactions: newTransactions, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactionsSearch'] });
      queryClient.invalidateQueries({ queryKey: ['transactionDetails'] }); 
      toast.success(editRes.message, { id: toastId });
    } else {
      toast.error(editRes.message, { id: toastId });
    }

    // For still invalidateQueries transactions, when not in last page, last ban item fails, and 
    // at least one ban succeeded.
    if (
      !searchedTransactionRef.current &&
      updatingTransactionStatusIdsRef.current.length === 0 &&
      hasSuccessfulStatusChangeRef.current
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

      hasSuccessfulStatusChangeRef.current = false;
    }
  }, []);

  let transaction;
  if (searchedTransaction) {
    transaction = searchedTransaction;
  } else if (dataT) {
    transaction = dataT;
  }

  // generate pageInfo like this: 1-10 of 20
  const pageInfo = useMemo(() => {
    return generatePageInfo({
      pageIndex: pagination.pageIndex,
      totalData: transaction?.rowCount,
      totalDataPerPage: transaction?.transactions?.length,
      searchKey: searchRef?.current?.value,
    });
  }, [transaction]);

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
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <div className="flex shadow-xs rounded-md flex-1">
            <div className="relative flex items-center -me-[1px] z-1 flex-1">
              <Input
                placeholder="Search with transaction code..."
                className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
                autoComplete="off"
                ref={searchRef}
                onKeyUp={handleEnterSearch}
                disabled={isFetchingT || isSearching}
              />
              {searchedTransaction ? (
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 w-4 h-5 p-0 z-1"
                    variant="ghost"
                    onClick={handleClearSearchInput}
                    disabled={isFetchingT || isSearching}
                  >
                    <X className="icon" />
                  </Button>
                </TooltipWrapper>
              ) : null}
            </div>
            <Button
              variant="secondary"
              className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
              disabled={isFetchingT || isSearching}
              onClick={() => handleSearch(filters)}
            >
              <Search />
            </Button>
          </div>

          <DropdownMenu>
            <TooltipWrapper text="Manage columns">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-3 py-1.5 h-auto">
                  <Columns />
                </Button>
              </DropdownMenuTrigger>
            </TooltipWrapper>
            <DropdownMenuContent align="end" className="min-w-50" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Columns</DropdownMenuLabel>
              {Object.entries(columnVisibility).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column[0]}
                  className="capitalize text-base hover:cursor-pointer"
                  checked={column[1]}
                  onCheckedChange={(value) =>
                    setColumnVisibility({
                      ...columnVisibility,
                      [column[0]]: value,
                    })}
                >
                  {column[0].replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(shouldShowSkeletonLoading.current && isFetchingT) || (isSearching && !searchedTransaction) ? (
        <TablePaginationSekeleton pagination={!isSearching} />
      ) : isErrorT ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorT.message}</AlertTitle>
        </Alert>
      ) : (
        <DataTable
          transaction={transaction}
          pageInfo={pageInfo}
          tableState={{
            columnVisibility,
            pagination,
            updatingTransactionStatusIds,
          }}
          tableHandler={{
            onPaginationChange: handlePaginationChange,
            onColumnVisibilityChange: setColumnVisibility,
            onEditTransactionStatus: handleEditTransactionStatus,
          }}
          isPlaceholderData={isPlaceholderDataC}
          hasSearched={!!searchedTransaction}
        />
      )}
    </>
  );
}
