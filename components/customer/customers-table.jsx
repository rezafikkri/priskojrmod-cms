'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isLastPage, getUnixTimestamp } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
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
import { cmsConfig } from '@/config/cms';
import SearchInput from '../ui/search-input';
import BanDialog from './ban-dialog';
import { useDialog } from '@/hooks/use-dialog';
import { useCheckQueryStale } from '@/hooks/use-check-query-stale';
import { deepEqual } from 'fast-equals';
import TableErrorAlert from '../ui/table-error-alert';
import { useStableTopLoader } from '@/hooks/use-stable-top-loader';
import { useFetchAction } from '@/hooks/use-fetch-action';
import TableActionDropdown from '../ui/table-action-dropdown';
import { changeToLastValidPage } from '@/lib/data-table';

const defaultColumnVisibility = {
  lastActive: true,
  createdAt: false,
  updatedAt: false,
};
const STALE_TIME = 1000 * 20;

export default function CustomersTable() {
  const queryClient = useQueryClient();
  const isQueryStale = useCheckQueryStale();
  const { start: startProgress, done: doneProgress } = useStableTopLoader();

  // Temporarily hides the top progress bar for refetch after a table action (e.g. update, delete)
  const suppressProgressBarRef = useRef(false);

  // search state
  const [searchKey, setSearchKey] = useState(null);
  const hasSearched = !!searchKey;

  // filters and fetch action state
  const [filters, setFilters] = useState({ showBanned: false });
  // Tracks user-triggered refetches.
  // Controls progress bar visibility and disables related UI buttons while fetching.
  // 'refresh' | 'search' | 'clear-search' | 'filter' | 'paginate' | null
  const { fetchAction, updateFetchAction, fetchActionRef } = useFetchAction();

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: cmsConfig.pagination.pageSize,
  });
  function handlePaginationChange(updater) {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    const isStale = isQueryStale(['customers', newPagination, filters, searchKey], STALE_TIME);

    if (isStale) {
      updateFetchAction('paginate');
    }
    setPagination(newPagination);
  }
  const columnVisibilityStorageKey = 'customers:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() =>
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility,
  );

  // dialog state
  const {
    data: deleteData,
    isOpen: isOpenDeleteDialog,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();
  
  const {
    data: banData,
    isOpen: isOpenBanDialog,
    open: openBanDialog,
    close: closeBanDialog,
  } = useDialog();

  // deleting ids and ban/unban state
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingBanStatusIds, setUpdatingBanStatusIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or banning succeed.
  const hasSuccessfulBanRef = useRef(false);
  const hasSuccessfulDeleteRef = useRef(false);

  // For track pending IDs to avoid repeated refetches when multiple actions run at once.
  // Refetch triggers only once after a success, keeping pages in sync.
  const deletingIdsRef = useRef(deletingIds);
  const updatingBanStatusIdsRef = useRef(updatingBanStatusIds);

  // add params to url
  function addParamsToURL(url, { filters, searchKey, pagination }) {
    let newUrl = `${url}?sb=${filters.showBanned}&pi=${pagination.pageIndex}`;

    // add search param to url
    if (searchKey) {
      newUrl += `&sk=${searchKey}`;
    }

    return newUrl;
  }

  const {
    data: dataC,
    isPending: isPendingC,
    isRefetching: isRefetchingC,
    isError: isErrorC,
    error: errorC,
    isPlaceholderData: isPlaceholderDataC,
  } = useQuery({
    queryKey: ['customers', pagination, filters, searchKey],
    queryFn: async ({ signal }) => {
      try {
        const results = await safeFetch({
          url: addParamsToURL('/api/customers', { filters, searchKey, pagination }),
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
    if (isRefetchingC && (!suppressProgressBarRef.current || fetchAction)) {
      startProgress();
    } else if (!isRefetchingC) {
      doneProgress();

      // reset fetchAction
      updateFetchAction(null);
    }
  }, [isRefetchingC, startProgress, doneProgress, fetchAction]);

  async function handleSearch(key) {
    const keyResult = searchKeySchema.safeParse(key);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;

    const queryKey = ['customers', pagination, filters, parsedKey];
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
      ['customers', { ...pagination, pageIndex: 0 }, filters, null],
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
      const customer = queryClient.getQueryData(['customers', pagination, filters, searchKey]);

      if (customer) {
        lastPageIndex = Math.ceil(customer.rowCount / cmsConfig.pagination.pageSize) - 1;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['customers'] });

    if (pagination.pageIndex === 0) return;

    const customer = queryClient.getQueryData(['customers', pagination, filters, searchKey]);
    if (customer) {
      changeToLastValidPage({
        rowCount: customer.rowCount,
        pagination,
        searchKey,
        filters,
        updateFetchAction,
        queryClient,
        baseQueryKey: 'customers',
        setPagination,
        lastPageIndex,
      });
    }
  }

  function handleFilter(newFilters) {
    const queryKey = ['customers', pagination, newFilters, searchKey];
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

  const handleEditBanStatus = useCallback(async ({ id, isBanned }) => {
    const nextIsBanned = !isBanned;

    // show loading
    const toastId = toast.loading(nextIsBanned ? 'Banning customer...' : 'Unbanning customer...');
    
    setUpdatingBanStatusIds((prev) => {
      const newIds = [...prev, id];
      updatingBanStatusIdsRef.current = newIds;
      return newIds;
    });

    const editRes = await editCustomerBanStatus(id, nextIsBanned);

    setUpdatingBanStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      updatingBanStatusIdsRef.current = newIds;
      return newIds;
    });

    const customer = queryClient.getQueryData(['customers', pagination, filters, searchKey]);

    if (editRes.status === 'success') {
      if (customer) {
        const newCustomers = customer.items.filter(customer => customer.id !== id);
        const newRowCount = customer.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: customer.rowCount,
        })) {
          queryClient.setQueryData(
            ['customers', pagination, filters, searchKey],
            { items: newCustomers, rowCount: newRowCount },
          );

          hasSuccessfulBanRef.current = true;
        } else {
          if (newCustomers.length === 0 && newRowCount > 0) {
            const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

            queryClient.setQueryData(
              ['customers', newPagination, filters, searchKey],
              (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, rowCount: newRowCount };
              },
            );

            // change page to prev page
            updateFetchAction('paginate');
            setPagination(newPagination);

            queryClient.removeQueries({
              queryKey: ['customers', pagination, filters, searchKey],
              exact: true,
            });
          } else {
            queryClient.setQueryData(
              ['customers', pagination, filters, searchKey],
              { items: newCustomers, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      queryClient.invalidateQueries({ queryKey: ['customersAutocomplete'] });
      toast.success(
        nextIsBanned ? 'Customer has been banned successfully.' : 'Customer has been unbanned successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (updatingBanStatusIdsRef.current.length === 0 && hasSuccessfulBanRef.current) {
      hasSuccessfulBanRef.current = false;

      if (
        customer &&
        !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: customer.rowCount,
        })
      ) {
        suppressProgressBarRef.current = true;
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        suppressProgressBarRef.current = false;
      }
    }
  }, [pagination, filters, searchKey]);

  async function handleDelete({ id }) {
    // show loading
    const toastId = toast.loading('Deleting customer...');

    setDeletingIds((prev) => {
      const newIds = [...prev, id];
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const removeRes = await removeCustomer(id);

    setDeletingIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const customer = queryClient.getQueryData(['customers', pagination, filters, searchKey]);

    if (removeRes.status === 'success') {
      if (customer) {
        const newCustomers = customer.items.filter(c => c.id !== id);
        const newRowCount = customer.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: customer.rowCount,
        })) {
          queryClient.setQueryData(
            ['customers', pagination, filters, searchKey],
            { items: newCustomers, rowCount: newRowCount },
          );

          hasSuccessfulDeleteRef.current = true;
        } else {
          if (newCustomers.length === 0 && newRowCount > 0) {
            const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

            queryClient.setQueryData(
              ['customers', newPagination, filters, searchKey],
              (oldData) => {
                if (!oldData) return oldData;

                return { ...oldData, rowCount: newRowCount };
              },
            );

            // change page to prev page
            updateFetchAction('paginate');
            setPagination(newPagination);

            queryClient.removeQueries({
              queryKey: ['customers', pagination, filters, searchKey],
              exact: true,
            });
          } else {
            queryClient.setQueryData(
              ['customers', pagination, filters, searchKey],
              { items: newCustomers, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
      }

      queryClient.invalidateQueries({ queryKey: ['customersAutocomplete'] });
      toast.success('Customer deleted successfully.', { id: toastId });
    } else {
      toast.error(removeRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (deletingIdsRef.current.length === 0 && hasSuccessfulDeleteRef.current) {
      hasSuccessfulDeleteRef.current = false;

      if (
        customer &&
        !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: customer.rowCount,
        })
      ) {
        suppressProgressBarRef.current = true;
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        suppressProgressBarRef.current = false;
      }
    }
  }

  // TABLE definition
  const shouldShowDeleteButton = useCallback(({ googleUserId, lastActive, isBanned }) => {
    const now = getUnixTimestamp();
    return (
      !googleUserId ||
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
      accessorKey: 'lastActive',
      header: () => 'Last Active',
      cell: ({ row }) => 
        row.getValue('lastActive')
          ? formatDateTime(row.getValue('lastActive'))
          : <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'createdAt',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      accessorKey: 'updatedAt',
      header: () => 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updatedAt')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <TableActionDropdown
          disabled={
            deletingIds.includes(row.original.id) ||
            updatingBanStatusIds.includes(row.original.id)
          }
        >
          <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild className="text-base hover:cursor-pointer">
            <Link href={`/customer/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="w-full text-base" asChild>
            <button
              onClick={() => {
                if (row.original.isBanned === false) {
                  openBanDialog({
                    id: row.original.id,
                    isBanned: row.original.isBanned,
                    email: row.getValue('email'),
                  });
                } else {
                  handleEditBanStatus({
                    id: row.original.id,
                    isBanned: row.original.isBanned,
                  });
                }
              }}
            >
              {row.original.isBanned === false ? 'Ban' : 'Unban'}
            </button>
          </DropdownMenuItem>
          {shouldShowDeleteButton({
            googleUserId: row.original.googleUserId,
            lastActive: row.getValue('lastActive'),
            isBanned: row.original.isBanned,
          }) && (
            <>
              <DropdownMenuSeparator className="-mx-1.5" />
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => openDeleteDialog({
                  id: row.original.id,
                  email: row.getValue('email'),
                  isBanned: row.original.isBanned,
                })}>
                  Delete
                </button>
              </DropdownMenuItem>
            </>
          )}
        </TableActionDropdown>
      ),
    },
  ], [
    deletingIds,
    updatingBanStatusIds,
    handleEditBanStatus,
    openDeleteDialog,
    openBanDialog,
  ]);
  
  const defaultData = useMemo(() => [], []);
  const table = useReactTable({
    data: dataC?.items ?? defaultData,
    rowCount: dataC?.rowCount,
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
        <div className="flex gap-6">
          <TooltipWrapper text="Create customer">
            <Button asChild variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
              <Link href="/customer/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex gap-3">
            <TooltipWrapper text="Refresh">
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto inline-block"
                disabled={isPendingC || fetchAction === 'refresh'}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>

            <FiltersPopover
              onFilter={handleFilter}
              filters={filters}
              disabled={isPendingC || fetchAction === 'filter'}
            />
           </div>
        </div>

        <div className="flex gap-3 max-lg:w-full w-2/5">
          <SearchInput
            className="flex-1"
            placeholder="Search with email..."
            disabled={isPendingC || fetchAction === 'search'}
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

      {isPendingC
        ? <TablePaginationSkeleton />
        : (
          <>
            <TableErrorAlert
              isError={isErrorC}
              message={errorC?.message}
              isSilent={errorC?.silent}
            />
            <DataTable table={table} />
            <TablePagination
              data={dataC}
              table={table}
              pagination={pagination}
              isPlaceholderData={isPlaceholderDataC}
            />
          </>
        )}

      <div className="mt-5">
        <p className="text-muted-foreground text-sm"><b>Notes</b>:</p>
        <ul className="text-muted-foreground text-sm list-disc list-inside">
          <li><i>Last Active</i> indicates the most recent recorded activity and is updated every 24 hours. This may not reflect real-time status.</li>
          <li>Only customers who have never signed in, have been inactive for more than 30 days, do not have any license keys associated with their account, or have been banned can be deleted directly.</li>
        </ul>
      </div>

      <DeleteDialog
        onDelete={handleDelete}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        deleteData={deleteData}
      />

      <BanDialog
        onBan={handleEditBanStatus}
        isOpen={isOpenBanDialog}
        onClose={closeBanDialog}
        banData={banData}
      />
    </>
  );
}
