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
import Link from 'next/link';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generatePageInfo, isLastPage } from '@/lib/utils';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, Search, X, Plus, Columns } from 'lucide-react';
import TablePaginationSekeleton from '../loadings/table-pagination-skeleton';
import { RotateCw } from 'lucide-react';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { safeFetch } from '@/lib/safe-fetch';
import { editCustomerBanStatus } from '@/actions/customer-actions';

export default function CustomersTable() {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState(null);
  const searchRef = useRef(null);

  // filters state
  const [filters, setFilters] = useState({ showBanned: false });
  const [isFilterActive, setIsFilterActive] = useState(false);

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE,
  });
  const [columnVisibility, setColumnVisibility] = useState({
    last_active: true,
    created_at: false,
    updated_at: false,
  });

  // This `useRef` is here to **always keep the newest `searchedCustomer` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedCustomer` value, which is called a "stale closure" problem.
  const searchedCustomerRef = useRef(searchedCustomer);
  const filtersRef = useRef(filters);
  useEffect(() => {
    searchedCustomerRef.current = searchedCustomer;
    filtersRef.current = filters;
  }, [searchedCustomer, filters]);


  const {
    data: dataC,
    isFetching: isFetchingC,
    status: statusC,
    isError: isErrorC,
    error: errorC,
    isPlaceholderData: isPlaceholderDataC,
  } = useQuery({
    queryKey: ['customers', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      if (statusC !== 'pending') {
        toastId = toast.loading('Loading customers...');
      }

      const results = await safeFetch({
        url: `/api/customers?pi=${pagination.pageIndex}&ib=${filters.showBanned}`,
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
    enabled: !searchedCustomer,
  });

  async function handleSearch(appliedFilters) {
    const keyResult = searchKeySchema.safeParse(searchRef.current.value);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['customersSearch', parsedKey, appliedFilters],
        queryFn: async () => {
          setIsSearching(true);
          // if previoesly searchedCustomer is null, then show skeleton loading
          // for all table, besides that, then show toast loading only
          let toastId;
          if (searchedCustomer) {
            toastId = toast.loading('Searching customers...');
          }

          return await safeFetch({
            url: `/api/customers?sk=${parsedKey}&ib=${appliedFilters.showBanned}`,
            onFinally: () => {
              if (toastId) {
                toast.dismiss(toastId);
              }
              setIsSearching(false);
            },
            errorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 10000,
        gcTime: 10000,
      });

      setSearchedCustomer(result.data);
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
    setPagination({
      ...pagination,
      pageIndex: 0,
    });
    setSearchedCustomer(null);
    searchRef.current.value = '';
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters.showBanned && !isFilterActive) {
      setIsFilterActive(true);
    } else if (!appliedFilters.showBanned && isFilterActive) {
      setIsFilterActive(false);
    }
  }

  async function handleFilter(newFilters) {
    if (searchedCustomer) {
      handleSearch(newFilters);
    } else {
      setPagination({
        ...pagination,
        pageIndex: 0,
      });
    }

    // set filters for trigger refetch in normal mode
    setFilters(newFilters);
    syncIsFilterActive(newFilters);
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customersSearch'] });
    if (searchedCustomer) {
      handleSearch(filters);
    }
  }

  const handleEditBanStatus = useCallback(async ({ id, isBanned, pagination }) => {
    const targetRow = document.querySelector(`#row${id}`);
    const targetActionBtn = targetRow.querySelector('td > button');
    targetRow.classList.add('opacity-50');
    targetActionBtn.setAttribute('disabled', true);

    const toastId = toast.loading(isBanned ? 'Banning customer...' : 'Unbanning customer...');

    const editRes = await editCustomerBanStatus(id, isBanned);

    targetRow.classList.remove('opacity-50');
    targetActionBtn.removeAttribute('disabled');

    if (editRes.status === 'success') {
      if (searchedCustomerRef.current) {
        setSearchedCustomer(prevCustomer => ({
          ...prevCustomer,
          customers: prevCustomer.customers.filter(customer => customer.id !== id),
        }));
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        const customer = queryClient.getQueryData(['customers', pagination.pageIndex, filtersRef.current]);
        const newCustomers = customer.customers.filter(customer => customer.id !== id);
        const newRowCount = customer.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: customer.rowCount,
        })) {
          queryClient.setQueryData(['customers', pagination.pageIndex, filtersRef.current], ({
            customers: newCustomers,
            rowCount: newRowCount,
          }));
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        } else {
          if (newCustomers.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['customers', pagination.pageIndex, filtersRef.current],
              exact: true,
            });
            queryClient.setQueryData(
              [ 'customers', pagination.pageIndex - 1, filtersRef.current ],
              (oldData) => ({
                ...oldData,
                rowCount: newRowCount,
              }),
            );
            setPagination({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            });
          } else {
            queryClient.setQueryData(['customers', pagination.pageIndex, filtersRef.current], () => ({
              customers: newCustomers,
              rowCount: newRowCount,
            }));
          }

          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['customersSearch'] });
      toast.success(
        isBanned ? 'Customer has been banned successfully.' : 'Customer has been unbanned successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId });
    }
  });

  let customer;
  if (searchedCustomer) {
    customer = searchedCustomer;
  } else if (dataC) {
    customer = dataC;
  }

  // generate pageInfo like this: 1-10 of 20
  const pageInfo = useMemo(() => {
    return generatePageInfo({
      pageIndex: pagination.pageIndex,
      totalData: customer?.rowCount,
      totalDataPerPage: customer?.customers?.length,
      searchKey: searchRef?.current?.value,
    });
  }, [customer]);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex space-x-6">
          <TooltipWrapper text="Create customer">
            <Button asChild variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
              <Link href="/customer/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex space-x-3">
            <TooltipWrapper text="Refresh">
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto inline-block"
                disabled={isFetchingC || isSearching}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>
            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingC || isSearching}
            />
           </div>
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <div className="flex shadow-xs rounded-md flex-1">
            <div className="relative flex items-center -me-[1px] z-1 flex-1">
              <Input
                placeholder="Search with email..."
                className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
                autoComplete="off"
                ref={searchRef}
                onKeyUp={handleEnterSearch}
              />
              {searchedCustomer ? (
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 w-4 h-5 p-0 z-1"
                    variant="ghost"
                    onClick={handleClearSearchInput}
                    disabled={isFetchingC || isSearching}
                  >
                    <X className="icon" />
                  </Button>
                </TooltipWrapper>
              ) : null}
            </div>
            <Button
              variant="secondary"
              className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
              disabled={isFetchingC || isSearching}
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

      {statusC === 'pending' || (isSearching && !searchedCustomer) ? (
        <TablePaginationSekeleton pagination={!isSearching} />
      ) : isErrorC ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorC.message}</AlertTitle>
        </Alert>
      ) : (
        <DataTable
          customer={customer}
          pageInfo={pageInfo}
          tableState={{
            columnVisibility,
            pagination,
          }}
          tableHandler={{
            onPaginationChange: setPagination,
            onColumnVisibilityChange: setColumnVisibility,
            onEditBanStatus: handleEditBanStatus,
          }}
          isPlaceholderData={isPlaceholderDataC}
          hasSearched={!!searchedCustomer}
        />
      )}

      <small className="mt-5 inline-block text-muted-foreground text-sm"><b>Note</b>: <i>Last Active</i> indicates the most recent recorded activity and is updated every 24 hours. This may not reflect real-time status.</small>
      <small className="mt-5 inline-block text-muted-foreground text-sm"><b>Note</b>: Only customers who have never signed in, have been inactive for more than 30 days, do not have any license keys associated with their account, or have been banned can be deleted directly.</small>
    </>
  );
}
