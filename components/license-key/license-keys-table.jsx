'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isLastPage } from '@/lib/utils';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import {
  editLicenseKeyRevokeStatus,
  releaseDevice,
  removeLicenseKey,
  setCanRegenerateKeys,
} from '@/actions/license-key-actions';
import { toast } from 'sonner';
import FiltersPopover from './filters-popover';
import { Button } from '../ui/button';
import { MoreHorizontal, Minus, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { safeFetch } from '@/lib/safe-fetch';
import { localStorageGet } from '@/lib/local-storage';
import DeleteDialog from './delete-dialog';
import EditRevokeStatusDialog from './edit-revoke-status-dialog';
import ResetDeviceDialog from './reset-device-dialog';
import { formatDateTime } from '@/lib/format-date';
import { Checkbox } from '../ui/checkbox';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DataTable from '../ui/data-table';
import TableColumnVisibility from '../ui/table-column-visibility';
import TablePagination from '../ui/table-pagination';
import TableSelectionAlert from '../ui/table-selection-alert';
import { cmsConfig } from '@/config/cms';
import SearchInput from '../ui/search-input';
import { useDialog } from '@/hooks/use-dialog';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { useCheckQueryStale } from '@/hooks/use-check-query-stale';
import { deepEqual } from 'fast-equals';

const defaultColumnVisibility = {
  appName: true,
  lastUsedAt: false,
  regeneratedAt: false,
  createdAt: false,
  updatedAt: false,
};
const STALE_TIME = 1000 * 20;

export default function LicenseKeysTable() {
  const queryClient = useQueryClient();
  const isQueryStale = useCheckQueryStale();

  // toast loading ref
  const loadingToastIdRef = useRef(null);

  // search state
  const [searchKey, setSearchKey] = useState(null);
  const hasSearched = !!searchKey;

  // filters and fetch action state
  const [filters, setFilters] = useState({ showRevoked: false });
  // Tracks active user-triggered or post-mutation fetch action.
  // Determines loading toast visibility and message.
  // 'refresh' | 'search' | 'clear-search' | 'filter' | 'paginate' | null (null = no toast shown)
  const [fetchAction, setFetchAction] = useState(null);

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: cmsConfig.pagination.pageSize,
  });
  function handlePaginationChange(updater) {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    const isStale = isQueryStale(['licenseKeys', newPagination, filters, searchKey], STALE_TIME);

    if (isStale) {
      setFetchAction('paginate');
    }
    setPagination(newPagination);
  }
  const [rowSelection, setRowSelection] = useState({});
  const columnVisibilityStorageKey = 'license-keys:column-visibility';
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
    data: editRevokeStatusData,
    isOpen: isOpenEditRevokeStatusDialog,
    open: openEditRevokeStatusDialog,
    close: closeEditRevokeStatusDialog,
  } = useDialog();

  const {
    data: resetDeviceData,
    isOpen: isOpenResetDeviceDialog,
    open: openResetDeviceDialog,
    close: closeResetDeviceDialog,
  } = useDialog();

  // deleting ids and revoke/unrevoke state
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingRevokeStatusIds, setUpdatingRevokeStatusIds] = useState([]);
  const [resetDeviceIds, setResetDeviceIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or revoke/unrevoke succeed.
  const hasSuccessfulDeleteRef = useRef(false);
  const hasSuccessfulRevokeRef = useRef(false);
  const hasSuccessfulResetDeviceRef = useRef(false);

  // For track pending IDs to avoid repeated refetches when multiple actions run at once.
  // Refetch triggers only once after a success, keeping pages in sync.
  const deletingIdsRef = useRef(deletingIds);
  const updatingRevokeStatusIdsRef = useRef(updatingRevokeStatusIds);
  const resetDeviceIdsRef = useRef(resetDeviceIds);

  // set can regenerate state
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Used to persist toast ID for the grant regenerate action,
  // allowing us to update the loading toast instead of showing a new one.
  const grantRegenerateToastIdRef = useRef(null);

  // add filters and search params to url
  function addParamsToURL(url, { filters, searchKey, pagination }) {
    // add filters params to url
    let newUrl = url + `?sr=${filters.showRevoked}`;

    if (filters.secretKeyId && filters.secretKeyId !== 'all') {
      newUrl += `&ski=${filters.secretKeyId}`;
    }
    if (filters.canRegenerate && filters.canRegenerate !== 'all') {
      newUrl += `&cr=${filters.canRegenerate}`;
    }

    // add search param to url
    if (searchKey) {
      newUrl += `&sk=${searchKey}`;
    } else {
      newUrl += `&pi=${pagination.pageIndex}`;
    }

    return newUrl;
  }

  const {
    data: dataLK,
    isLoading: isLoadingLK,
    isRefetching: isRefetchingLK,
    isError: isErrorLK,
    error: errorLK,
    isPlaceholderData: isPlaceholderDataLK,
  } = useQuery({
    queryKey: ['licenseKeys', pagination, filters, searchKey],
    queryFn: async ({ signal }) => {
      const result = await safeFetch({
        url: addParamsToURL('/api/license-keys', { filters, searchKey, pagination }),
        signal,
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });

  // manage toast loading
  useEffect(() => {
    if (isRefetchingLK && fetchAction) {
      const activeActionToastId = grantRegenerateToastIdRef.current;
      const loadingToastId = loadingToastIdRef.current;

      let loadingVerb = 'Loading';
      if (fetchAction === 'search') loadingVerb = 'Searching';
      if (fetchAction === 'refresh') loadingVerb = 'Refreshing';
      const loadingMessage = `${loadingVerb} license keys...`;

      if (activeActionToastId) {
        toast.loading(loadingMessage, { id: activeActionToastId });

        grantRegenerateToastIdRef.current = null;
      } else if (loadingToastId) {
        loadingToastIdRef.current = toast.loading(loadingMessage, { id: loadingToastId });
      } else {
        // Use requestAnimationFrame so the toast is created after the UI
        // stabilizes, preventing it from being skipped during rapid rerenders.
        requestAnimationFrame(() => {
          loadingToastIdRef.current = toast.loading(loadingMessage);
        });
      }
    } else if (!isRefetchingLK) {
      if (loadingToastIdRef.current) {
        // dismiss toast
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }

      // reset fetchAction
      if (fetchAction !== 'refresh') {
        setFetchAction(null);
      }
    }
  }, [isRefetchingLK, fetchAction]);

  function handleSearch(key) {
    const keyResult = searchKeySchema.safeParse(key);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;

    const queryKey = ['licenseKeys', pagination, filters, parsedKey];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      setFetchAction('search');

      if (searchKey === parsedKey) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }

    // reset rowSelection
    setRowSelection({});
    setSearchKey(parsedKey);
  }

  function handleEnterSearch(e) {
    if (e.key === 'Enter') {
      handleSearch(e.target.value);
    }
  }

  function handleClearSearchInput() {
    const isStale = isQueryStale(
      ['licenseKeys', { ...pagination, pageIndex: 0 }, filters, null],
      STALE_TIME,
    );

    if (isStale) {
      setFetchAction('clear-search');
    }

    setPagination({ ...pagination, pageIndex: 0 });
    // reset rowSelection
    setRowSelection({});
    setSearchKey(null);
  }

  async function handleRefresh() {
    setFetchAction('refresh');
    // reset rowSelection
    setRowSelection({});

    await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
    setFetchAction(null);
  }

  function handleFilter(newFilters) {
    const queryKey = ['licenseKeys', pagination, newFilters, searchKey];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      setFetchAction('filter');

      if (deepEqual(filters, newFilters) && (hasSearched || pagination.pageIndex === 0)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }
    
    if (!hasSearched) {
      setPagination({ ...pagination, pageIndex: 0 });
    }

    // reset rowSelection
    setRowSelection({});
    // set filters for trigger refetch
    setFilters(newFilters);

    // if canRegenerate = 'yes'
    if (newFilters?.canRegenerate === 'yes' || newFilters.showRevoked) {
      if (columnVisibility.select === undefined || columnVisibility.select === true) {
        setColumnVisibility(prev => ({
          ...prev,
          select: false,
        }));
      }
    } else if (columnVisibility.select === false) {
      setColumnVisibility(prev => ({
        ...prev,
        select: true,
      }));
    }

    // if secretKeyId != 'all'
    if (newFilters.secretKeyId && newFilters.secretKeyId !== 'all') {
      if (columnVisibility.appName) {
        setColumnVisibility(prev => ({
          ...prev,
          appName: false,
        }));
      }
    } else if (!columnVisibility.appName) {
      setColumnVisibility(prev => ({
        ...prev,
        appName: true,
      }));
    }
  }

  async function handleDelete({ id }) {
    // show loading
    const toastId = toast.loading('Deleting license key...');

    // This is for add opacity-50 style to deleted row
    setDeletingIds((prev) => {
      const newIds = [...prev, id];
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const removeRes = await removeLicenseKey(id);

    setDeletingIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData(['licenseKeys', pagination, filters, searchKey]);

    if (removeRes.status === 'success') {
      if (licenseKey) {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== id);

        if (hasSearched) {
          queryClient.setQueryData(
            ['licenseKeys', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;
            
              return { ...oldData, items: newLicenseKeys };
            },
          );

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        } else {
          const newRowCount = licenseKey.rowCount - 1;

          if (!isLastPage({
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            rowCount: licenseKey.rowCount,
          })) {
            queryClient.setQueryData(
              ['licenseKeys', pagination, filters, searchKey],
              { items: newLicenseKeys, rowCount: newRowCount },
            );

            hasSuccessfulDeleteRef.current = true;
          } else {
            if (newLicenseKeys.length === 0 && newRowCount > 0) {
              const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

              queryClient.setQueryData(
                ['licenseKeys', newPagination, filters, searchKey],
                (oldData) => {
                  if (!oldData) return oldData;

                  return { ...oldData, rowCount: newRowCount };
                },
              );

              // change page to prev page
              setFetchAction('paginate');
              setPagination(newPagination);

              queryClient.removeQueries({
                queryKey: ['licenseKeys', pagination, filters, searchKey],
                exact: true,
              });
            } else {
              queryClient.setQueryData(
                ['licenseKeys', pagination, filters, searchKey],
                { items: newLicenseKeys, rowCount: newRowCount },
              );
            }

            queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
          }
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
      toast.success(`License key deleted successfully`, { id: toastId });
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
      if (
        licenseKey &&
        !hasSearched &&
        !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: licenseKey.rowCount,
        })
      ) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulDeleteRef.current = false;
    }
  }

  async function handleSetCanRegenerate() {
    const rowSelections = Object.keys(rowSelection);
    if (rowSelections.length <= 0) return false;

    setIsRegenerating(true);
    // show loading
    const toastId = toast.loading('Enabling regeneration...');

    // not use try/catch because in server actions already using try/catch
    const setCanRegenerateRes = await setCanRegenerateKeys(rowSelections);

    if (setCanRegenerateRes.status === 'success') {
      // get lastPageIndex before refreshing
      let lastPageIndex = 0;
      
      if (!hasSearched && filters?.canRegenerate !== 'all') {
        const licenseKey = queryClient.getQueryData(['licenseKeys', pagination, filters, searchKey]);
        if (licenseKey) {
          lastPageIndex = Math.ceil(licenseKey.rowCount / cmsConfig.pagination.pageSize) - 1;
        }
      }

      let refreshFailed = false;
      let pageChange = false;

      try {
        if (setCanRegenerateRes.data.count > 0) {
          setFetchAction('refresh');
          grantRegenerateToastIdRef.current = toastId;

          await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] }, { throwOnError: true });

          // if need to change page
          if (!hasSearched && filters?.canRegenerate !== 'all') {
            const licenseKey = queryClient.getQueryData(['licenseKeys', pagination, filters, searchKey]);

            if (licenseKey && licenseKey.rowCount > 0) {
              const newLastPageIndex = Math.ceil(licenseKey.rowCount / cmsConfig.pagination.pageSize) - 1;

              if (pagination.pageIndex > newLastPageIndex) {
                const newPagination = { ...pagination, pageIndex: newLastPageIndex };

                queryClient.setQueryData(
                  ['licenseKeys', newPagination, filters, searchKey],
                  (oldData) => {
                    if (!oldData) return oldData;

                    return { ...oldData, rowCount: licenseKey.rowCount };
                  },
                );

                // invalidate again for only the new last page for refetch
                queryClient.invalidateQueries({
                  queryKey: ['licenseKeys', newPagination, filters, searchKey],
                  exact: true
                });
                // change page to new last page index
                setFetchAction('paginate');
                setPagination(newPagination);
                pageChange = true;

                // remove query for some page that no have data
                for (let i = lastPageIndex; i > newLastPageIndex; i--) {
                  queryClient.removeQueries({
                    queryKey: ['licenseKeys', { ...pagination, pageIndex: i }, filters, searchKey],
                    exact: true,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        refreshFailed = true;
      }

      setRowSelection({});

      if (setCanRegenerateRes.data.count > 0) {
        if (!pageChange) {
          // reset fetchAction if still set, since the page didn't change
          setFetchAction(null);
        }

        let successMessage = `Regeneration enabled successfully for ${setCanRegenerateRes.data.count} license keys.`;
        if (refreshFailed) {
          successMessage += ' Please refresh the table manually.';
        }
        toast.success(successMessage, { id: toastId });
      } else {
        toast.info('No license keys were updated. They may have already been deleted.', { id: toastId });
      }
    } else {
      toast.error(setCanRegenerateRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    setIsRegenerating(false);
  }

  async function handleEditRevokeStatus({ id, isRevoked }) {
    const toastId = toast.loading(
      `${isRevoked ? 'Unrevoking' : 'Revoking'} license key...`,
    );

    // This is for add opacity-50 style to updated revoke status row
    setUpdatingRevokeStatusIds((prev) => {
      const newIds = [...prev, id];
      updatingRevokeStatusIdsRef.current = newIds;
      return newIds;
    });

    const editRes = await editLicenseKeyRevokeStatus(id, !isRevoked);

    setUpdatingRevokeStatusIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      updatingRevokeStatusIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData(['licenseKeys', pagination, filters, searchKey]);

    if (editRes.status === 'success') {
      if (licenseKey) {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== id);

        if (hasSearched) {
          queryClient.setQueryData(
            ['licenseKeys', pagination, filters, searchKey],
            (oldData) => {
              if (!oldData) return oldData;
            
              return { ...oldData, items: newLicenseKeys };
            },
          );

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });         
        } else {
          const newRowCount = licenseKey.rowCount - 1;

          if (!isLastPage({
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            rowCount: licenseKey.rowCount,
          })) {
            queryClient.setQueryData(
              ['licenseKeys', pagination, filters, searchKey],
              { items: newLicenseKeys, rowCount: newRowCount },
            );

            hasSuccessfulRevokeRef.current = true;
          } else {
            if (newLicenseKeys.length === 0 && newRowCount > 0) {
              const newPagination = { ...pagination, pageIndex: pagination.pageIndex - 1 };

              queryClient.setQueryData(
                ['licenseKeys', newPagination, filters, searchKey],
                (oldData) => {
                  if (!oldData) return oldData;

                  return { ...oldData, rowCount: newRowCount };
                },
              );

              // change page to prev page
              setFetchAction('paginate');
              setPagination(newPagination);

              queryClient.removeQueries({
                queryKey: ['licenseKeys', pagination, filters, searchKey],
                exact: true,
              });
            } else {
              queryClient.setQueryData(
                ['licenseKeys', pagination, filters, searchKey],
                { items: newLicenseKeys, rowCount: newRowCount },
              );
            }

            queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });         
          }
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
      toast.success(
        isRevoked
          ? 'License key unrevoked successfully.'
          : 'License key revoked successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (updatingRevokeStatusIdsRef.current.length === 0 && hasSuccessfulRevokeRef.current) {
      if (
        licenseKey &&
        !hasSearched && 
        !isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: licenseKey.rowCount,
        })
      ) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulRevokeRef.current = false;
    }
  }

  async function handleResetDevice({ id }) {
    // show loading
    const toastId = toast.loading('Resetting device...');

    // This is for add opacity-50 style target row
    setResetDeviceIds((prev) => {
      const newIds = [...prev, id];
      resetDeviceIdsRef.current = newIds;
      return newIds;
    });

    const releaseRes = await releaseDevice(id);

    setResetDeviceIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      resetDeviceIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData(['licenseKeys', pagination, filters, searchKey]);
    const newLicenseKeys = licenseKey?.items?.filter(lk => lk.id !== id);

    if (releaseRes.status === 'success') {
      if (hasSearched) {
        queryClient.setQueryData(
          ['licenseKeys', pagination, filters, searchKey],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              items: oldData.items.map(lk => {
                if (lk.id === id) {
                  return {
                    ...lk,
                    deviceId: null,
                    updatedAt: releaseRes.data.updatedAt,
                  };
                }
                return lk;
              }),
            };
          },
        );
      } else if (pagination.pageIndex === 0) {
        queryClient.setQueryData(
          ['licenseKeys', pagination, filters, searchKey],
          (oldData) => {
            if (!oldData) return oldData;

            const targetLicenseKey = oldData.items.find(lk => lk.id === id);

            if (targetLicenseKey) {
              return {
                ...oldData,
                items: [
                  {
                    ...targetLicenseKey,
                    deviceId: null,
                    updatedAt: releaseRes.data.updatedAt,
                  },
                  ...oldData.items.filter(lk => lk.id !== id),
                ],
              };
            }
            return oldData;
          },
        );
      } else if (newLicenseKeys?.length === 0) {
        // if new license length exactly === 0, mean is not undefined too, then
        setFetchAction('paginate');
        setPagination((pagination) => ({
          ...pagination,
          pageIndex: pagination.pageIndex - 1,
        }));
      } else {
        queryClient.setQueryData(
          ['licenseKeys', pagination, filters, searchKey],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              items: oldData.items.filter(lk => lk.id !== id),
            };
          },
        );

        hasSuccessfulResetDeviceRef.current = true;
      }

      if (hasSearched || pagination.pageIndex === 0 || newLicenseKeys?.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
      }

      toast.success('License key device reset successfully.', { id: toastId });
    } else {
      toast.error(releaseRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // Batches overlapping actions (new action triggered before previous one finishes)
    // into a single invalidateQueries, once all settled and at least one succeeded.
    // Sequential actions are not affected.
    if (resetDeviceIdsRef.current.length === 0 && hasSuccessfulResetDeviceRef.current) {
      if (!hasSearched && pagination.pageIndex !== 0 && newLicenseKeys?.length !== 0) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });       
      }

      hasSuccessfulResetDeviceRef.current = false;
    }
  }

  // TABLE definition
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
      id: 'email',
      accessorKey: 'customer.email',
      header: 'Email',
      enableHiding: false,
    },
    {
      id: 'appName',
      accessorKey: 'secretKey.product.name',
      header: 'App Name',
    },
    {
      accessorKey: 'expiredAt',
      enableHiding: false,
      header: () => 'Expired At',
      cell: ({ row }) => formatDateTime(row.getValue('expiredAt')),
    },
    {
      accessorKey: 'lastUsedAt',
      header: () => 'Last Used At',
      cell: ({ row }) =>
        row.getValue('lastUsedAt')
          ? formatDateTime(row.getValue('lastUsedAt'))
          : <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'regeneratedAt',
      header: () => 'Regenerated At',
      cell: ({ row }) => 
        row.getValue('regeneratedAt')
          ? formatDateTime(row.getValue('regeneratedAt'))
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus-visible:ring-ring"
              disabled={
                deletingIds.includes(row.original.id) ||
                updatingRevokeStatusIds.includes(row.original.id) ||
                resetDeviceIds.includes(row.original.id)
              }
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild className="text-base hover:cursor-pointer">
              <Link href={`/license-key/${row.original.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="w-full text-base"
              asChild
            >
              <button onClick={() => {
                navigator.clipboard.writeText(row.original.code);
                toast.success('License key code copied to clipboard');
              }}>
                Copy code
              </button>
            </DropdownMenuItem>

            {row.original.deviceId && (
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => openResetDeviceDialog({
                  id: row.original.id,
                  email: row.getValue('email'),
                  appName: row.getValue('appName'),
                })}>
                  Reset device
                </button>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="w-full text-base"
              asChild
            >
              <button onClick={() => openEditRevokeStatusDialog({
                id: row.original.id,
                email: row.getValue('email'),
                appName: row.getValue('appName'),
                isRevoked: row.original.isRevoked,
              })}>
                {row.original.isRevoked ? 'Unrevoke' : 'Revoke'}
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5" />
            <DropdownMenuItem className="w-full text-base" asChild>
              <button onClick={() => openDeleteDialog({
                id: row.original.id,
                email: row.getValue('email'),
                appName: row.getValue('appName'),
              })}>
                Delete
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [
    deletingIds,
    updatingRevokeStatusIds,
    resetDeviceIds,
    openDeleteDialog,
    openEditRevokeStatusDialog,
    openResetDeviceDialog,
  ]);
  const table = useReactTable({
    data: dataLK?.items,
    columns,
    rowCount: dataLK?.rowCount,
    state: {
      columnVisibility,
      pagination,
      rowSelection,
    },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId: row => row.id,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex max-lg:flex-wrap max-lg:w-full gap-6">
          <TooltipWrapper text="Create license key">
            <Button
              asChild
              variant="outline"
              className="md:w-auto h-auto text-base px-3 py-1.5 inline-block"
            >
              <Link href="/license-key/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex gap-3">
            <TooltipWrapper text="Refresh">
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto inline-block"
                disabled={isLoadingLK || fetchAction === 'refresh'}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>
            
            <FiltersPopover
              onFilter={handleFilter}
              filters={filters}
              disabled={isLoadingLK || fetchAction === 'filter'}
            />

            {(filters?.canRegenerate !== 'yes' && !filters.showRevoked) && (
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto"
                disabled={isLoadingLK
                  || (fetchAction !== 'paginate' && fetchAction !== null)
                  || Object.keys(rowSelection).length <= 0
                  || isRegenerating}
                onClick={handleSetCanRegenerate}
              >Set can regenerate</Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 max-lg:w-full w-2/5">
          <SearchInput
            className="flex-1"
            placeholder="Search with email..."
            disabled={isLoadingLK || fetchAction === 'search'}
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

      {isLoadingLK ? (
        <TablePaginationSkeleton showPagination={!hasSearched} />
      ) : isErrorLK ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorLK.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <TableSelectionAlert table={table} />
          <DataTable
            table={table}
            processingIds={[
              ...deletingIds,
              ...updatingRevokeStatusIds,
              ...resetDeviceIds,
            ]}
          />
          <TablePagination
            data={dataLK}
            table={table}
            pagination={pagination}
            isPlaceholderData={isPlaceholderDataLK}
          />
        </>
      )}

      {dataLK?.isTooMany ? (
        <p className="mt-5 text-muted-foreground text-sm"><b>Info</b>: If you haven't found the license key you're looking for, please use a more specific email!</p>
      ) : null}

      <DeleteDialog
        onDelete={handleDelete}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        deleteData={deleteData}
      />
      <EditRevokeStatusDialog
        onEditRevokeStatus={handleEditRevokeStatus}
        isOpen={isOpenEditRevokeStatusDialog}
        onClose={closeEditRevokeStatusDialog}
        editRevokeStatusData={editRevokeStatusData}
      />
      <ResetDeviceDialog
        onReset={handleResetDevice}
        isOpen={isOpenResetDeviceDialog}
        onClose={closeResetDeviceDialog}
        resetData={resetDeviceData}
      />
    </>
  );
}
