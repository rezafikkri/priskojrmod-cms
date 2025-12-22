'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isLastPage } from '@/lib/utils';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, Search, X, Plus, MoreHorizontal, Minus } from 'lucide-react';
import TablePaginationSekeleton from '../loadings/table-pagination-skeleton';
import { RotateCw } from 'lucide-react';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { safeFetch } from '@/lib/safe-fetch';
import { editCustomerBanStatus, removeCustomer } from '@/actions/customer-actions';
import { localStorageGet } from '@/lib/local-storage';
import { formatDateTime } from '@/lib/format-date';
import ProfileBadge from '../ui/profile-badge';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import TableColumnVisibility from '../ui/table-column-visibility';
import DataTable from '../ui/data-table';
import TablePagination from '../ui/table-pagination';
import DeleteDialog from './delete-dialog';

const defaultColumnVisibility = {
  last_active: true,
  created_at: false,
  updated_at: false,
};

export default function CustomersTable() {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState(null);
  const searchRef = useRef(null);

  // filters state
  const [filters, setFilters] = useState({ showBanned: false });
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
  const columnVisibilityStorageKey = 'customers:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() =>
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility,
  );

  // delete dialog state
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  // deleting ids and ban/unban state
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingBanStatusIds, setUpdatingBanStatusIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or banning succeed.
  const hasSuccessfulBanRef = useRef(false);
  const hasSuccessfulDeleteRef = useRef(false);

  // This `useRef` is here to **always keep the newest `searchedCustomer and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedCustomer and more state` value, which is called a "stale closure" problem.
  const searchedCustomerRef = useRef(searchedCustomer);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const deletingIdsRef = useRef(deletingIds);
  const updatingBanStatusIdsRef = useRef(updatingBanStatusIds);

  useEffect(() => {
    searchedCustomerRef.current = searchedCustomer;
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [searchedCustomer, filters, pagination]);

  const {
    data: dataC,
    isFetching: isFetchingC,
    isError: isErrorC,
    error: errorC,
    isPlaceholderData: isPlaceholderDataC,
  } = useQuery({
    queryKey: ['customers', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      if (!shouldShowSkeletonLoading.current) {
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
        staleTime: 10_000,
        gcTime: 10_000,
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
    handlePaginationChange({
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

  function handleFilter(newFilters) {
    if (searchedCustomer) {
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
    if (!searchedCustomer && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }
    
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customersSearch'] });

    if (searchedCustomer) {
      handleSearch(filters);
    }
  }

  const handleEditBanStatus = useCallback(async ({ id, isBanned }) => {
    // not show table skeleton loading
    if (!searchedCustomerRef.current && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to updated row
    setUpdatingBanStatusIds((prev) => {
      const newIds = [...prev, id];
      updatingBanStatusIdsRef.current = newIds;
      return newIds;
    });
    const toastId = toast.loading(isBanned ? 'Banning customer...' : 'Unbanning customer...');

    const editRes = await editCustomerBanStatus(id, isBanned);

    setUpdatingBanStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      updatingBanStatusIdsRef.current = newIds;
      return newIds;
    });

    const customer = queryClient.getQueryData([
      'customers',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (editRes.status === 'success') {
      if (searchedCustomerRef.current) {
        setSearchedCustomer(prevCustomer => ({
          ...prevCustomer,
          items: prevCustomer.items.filter(customer => customer.id !== id),
        }));

        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        const newCustomers = customer.items.filter(customer => customer.id !== id);
        const newRowCount = customer.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: customer.rowCount,
        })) {
          queryClient.setQueryData(
            ['customers', paginationRef.current.pageIndex, filtersRef.current],
            { items: newCustomers, rowCount: newRowCount },
          );

          if (!hasSuccessfulBanRef.current) {
            hasSuccessfulBanRef.current = true;
          }
        } else {
          if (newCustomers.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['customers', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['customers', paginationRef.current.pageIndex - 1, filtersRef.current],
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
              ['customers', paginationRef.current.pageIndex, filtersRef.current],
              { items: newCustomers, rowCount: newRowCount },
            );
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

    // For still invalidateQueries customers, when not in last page, last ban item fails, and 
    // at least one ban succeeded.
    if (
      !searchedCustomerRef.current &&
      updatingBanStatusIdsRef.current.length === 0 &&
      hasSuccessfulBanRef.current
    ) {
      if (!isLastPage({
        pageIndex: paginationRef.current.pageIndex,
        pageSize: paginationRef.current.pageSize,
        rowCount: customer.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      hasSuccessfulBanRef.current = false;
    }
  }, []);

  async function handleDelete({ deleteData, toastId }) {
    // not show table skeleton loading
    if (!searchedCustomer && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to deleted row
    setDeletingIds((prev) => {
      const newIds = [...prev, deleteData.id];
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const removeRes = await removeCustomer(deleteData.id);

    setDeletingIds((prev) => {
      const newIds = prev.filter(id => id !== deleteData.id);
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const customer = queryClient.getQueryData([
      'customers',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    // Test queryKey apakah akan up-to-date, ketika await masih pending, tetapi kita ubah paginationnya
    // Hasil: queryKey tidak up-to-date, alias stale
    if (removeRes.status === 'success') {
      if (searchedCustomerRef.current) {
        setSearchedCustomer((prevCustomer) => ({
          ...prevCustomer,
          items: prevCustomer.items.filter(customer => customer.id !== deleteData.id),
        }));

        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        const newCustomers = customer.items.filter(customer => customer.id !== deleteData.id);
        const newRowCount = customer.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: customer.rowCount,
        })) {
          queryClient.setQueryData(
            ['customers', paginationRef.current.pageIndex, filtersRef.current],
            { items: newCustomers, rowCount: newRowCount },
          );

          if (!hasSuccessfulDeleteRef.current) {
            hasSuccessfulDeleteRef.current = true;
          }
        } else {
          if (newCustomers.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['customers', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });
            
            queryClient.setQueryData(
              ['customers', paginationRef.current.pageIndex - 1, filtersRef.current],
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
              ['customers', paginationRef.current.pageIndex, filtersRef.current],
              { items: newCustomers, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['customersSearch'] });
      toast.success('Customer deleted successfully.', { id: toastId });
    } else {
      toast.error(removeRes.message, { id: toastId });
    }

    // For still invalidateQueries customers, when not in last page, last delete item fails, and 
    // at least one delete succeeded.
    if (
      !searchedCustomerRef.current &&
      deletingIdsRef.current.length === 0 &&
      hasSuccessfulDeleteRef.current
    ) {
      if (!isLastPage({
        pageIndex: paginationRef.current.pageIndex,
        pageSize: paginationRef.current.pageSize,
        rowCount: customer.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      hasSuccessfulDeleteRef.current = false;
    }
  }

  const hasSearched = !!searchedCustomer;
  let customer;
  if (searchedCustomer) {
    customer = searchedCustomer;
  } else if (dataC) {
    customer = dataC;
  }

  // TABLE definition
  const shouldShowDeleteButton = useCallback(({ oauthId, lastActive, isBanned }) => {
    const now = Math.floor(new Date().getTime() / 1000);
    return (
      !oauthId ||
      !lastActive ||
      (now - lastActive > (60 * 60 * 24 * 30)) ||
      isBanned
    );
  }, []);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ProfileBadge
            src={row.original.picture}
            fallbackText={row.getValue('name')}
          />
          <span className="text-wrap">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableHiding: false,
    },
    {
      accessorKey: 'last_active',
      header: () => 'Last Active',
      cell: ({ row }) => 
        row.getValue('last_active')
          ? formatDateTime(row.getValue('last_active'))
          : <Minus className="size-4 text-zinc-300" />,
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
                deletingIds.includes(row.original.id) ||
                updatingBanStatusIds.includes(row.original.id)
              }
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild className="text-base hover:cursor-pointer">
              <Link href={`/customer/${row.original.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="w-full text-base"
              onClick={() => handleEditBanStatus({
                id: row.original.id,
                isBanned: !row.original.is_banned,
              })}
              asChild
            >
              <button>
                {row.original.is_banned === false ? 'Ban' : 'Unban'}
              </button>
            </DropdownMenuItem>
            {shouldShowDeleteButton({
              oauthId: row.original.oauth_id,
              lastActive: row.getValue('last_active'),
              isBanned: row.original.is_banned,
            }) && (
              <>
                <DropdownMenuSeparator className="-mx-1.5" />
                <DropdownMenuItem
                  className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                  asChild
                >
                  <button
                    onClick={() => {
                      setDeleteData({ id: row.original.id, email: row.getValue('email') });
                      setIsOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </button>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [deletingIds, updatingBanStatusIds]);
  const table = useReactTable({
    data: customer?.items,
    rowCount: customer?.rowCount ?? 0,
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
                ref={searchRef}
                onKeyUp={handleEnterSearch}
                disabled={isFetchingC || isSearching}
              />
              {searchedCustomer ? (
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 size-6 z-1"
                    variant="ghost"
                    onClick={handleClearSearchInput}
                    disabled={isFetchingC || isSearching}
                  >
                    <X />
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

          <TableColumnVisibility
            table={table}
            defaultColumnVisibility={defaultColumnVisibility}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            storageKey={columnVisibilityStorageKey}
          />
        </div>
      </div>

      {(shouldShowSkeletonLoading.current && isFetchingC) || (isSearching && !searchedCustomer) ? (
        <TablePaginationSekeleton showPagination={!isSearching} />
      ) : isErrorC ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorC.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <DataTable
            table={table}
            processingIds={[
              ...deletingIds,
              ...updatingBanStatusIds,
            ]}
          />
          <TablePagination
            data={customer}
            table={table}
            pagination={pagination}
            isPlaceholderData={isPlaceholderDataC}
            showNavigation={!hasSearched}
          />
        </>
      )}
      
      {(hasSearched && customer?.isTooMany) ? (
        <p className="mt-5 text-muted-foreground text-sm"><b>Info</b>: If you haven't found the customer you're looking for, please use a more specific email!</p>
      ) : null}
      <p className="mt-5 text-muted-foreground text-sm"><b>Notes</b>:</p>
      <ul className="text-muted-foreground text-sm list-disc list-inside">
        <li><i>Last Active</i> indicates the most recent recorded activity and is updated every 24 hours. This may not reflect real-time status.</li>
        <li>Only customers who have never signed in, have been inactive for more than 30 days, do not have any license keys associated with their account, or have been banned can be deleted directly.</li>
      </ul>

      <DeleteDialog
        onDelete={handleDelete}
        isOpen={isOpenDeleteDialog}
        onIsOpenChange={setIsOpenDeleteDialog}
        onDeleteDataChange={setDeleteData}
        deleteData={deleteData}
      />
    </>
  );
}
