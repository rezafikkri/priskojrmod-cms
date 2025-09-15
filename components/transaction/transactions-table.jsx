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

export default function TransactionsTable() {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [searchedTranscation, setSearchedTransaction] = useState(null);
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

  // This `useRef` is here to **always keep the newest `searchedTranscation and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedTranscation and more state` value, which is called a "stale closure" problem.
  const searchedTranscationRef = useRef(searchedTranscation);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  useEffect(() => {
    searchedTranscationRef.current = searchedTranscation;
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [searchedTranscation, filters, pagination]);

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
    enabled: !searchedTranscation,
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
          // if previoesly searchedTranscation is null, then show skeleton loading
          // for all table, besides that, then show toast loading only
          let toastId;
          if (searchedTranscation) {
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
    if (searchedTranscation) {
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
    if (!searchedTranscation) {
      shouldShowSkeletonLoading.current = false;
    }
    
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactionsSearch'] });

    if (searchedTranscation) {
      handleSearch(filters);
    }
  }

  let transaction;
  if (searchedTranscation) {
    transaction = searchedTranscation;
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
              {searchedTranscation ? (
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

      {(shouldShowSkeletonLoading.current && isFetchingT) || (isSearching && !searchedTranscation) ? (
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
          }}
          tableHandler={{
            onPaginationChange: handlePaginationChange,
            onColumnVisibilityChange: setColumnVisibility,
          }}
          isPlaceholderData={isPlaceholderDataC}
          hasSearched={!!searchedTranscation}
        />
      )}
    </>
  );
}
