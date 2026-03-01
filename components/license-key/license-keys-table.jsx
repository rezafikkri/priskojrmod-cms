'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isLastPage } from '@/lib/utils';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
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
import { searchKeySchema } from '@/lib/validators/base-validator';
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

const defaultColumnVisibility = {
  appName: true,
  lastUsedAt: false,
  regeneratedAt: false,
  createdAt: false,
  updatedAt: false,
};

export default function LicenseKeysTable() {
  const queryClient = useQueryClient();

  // search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLicenseKey, setSearchedLicenseKey] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const searchRef = useRef(null);

  // filters state
  const [filters, setFilters] = useState({ showRevoked: false });
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

  // add filters to url
  function addFiltersToURL(url, appliedFilters) {
    let newUrl = url + `&sr=${appliedFilters.showRevoked}`;

    if (appliedFilters.secretKeyId && appliedFilters.secretKeyId !== 'all') {
      newUrl += `&ski=${appliedFilters.secretKeyId}`;
    }
    if (appliedFilters.canRegenerate && appliedFilters.canRegenerate !== 'all') {
      newUrl += `&cr=${appliedFilters.canRegenerate}`;
    }

    return newUrl;
  }

  const {
    data: dataLK,
    isFetching: isFetchingLK,
    isError: isErrorLK,
    error: errorLK,
    isPlaceholderData: isPlaceholderDataLK,
  } = useQuery({
    queryKey: ['licenseKeys', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      const activeToastId = grantRegenerateToastIdRef.current;

      if (!shouldShowSkeletonLoading.current) {
        if (activeToastId) {
          toastId = toast.loading('Refreshing license keys...', { id: activeToastId });

          grantRegenerateToastIdRef.current = null;
        } else {
          toastId = toast.loading('Loading license keys...');
        }
      }

      const results = await safeFetch({
        url: addFiltersToURL(`/api/license-keys?pi=${pagination.pageIndex}`, filters),
        onFinally: () => {
          if (toastId && !activeToastId) {
            toast.dismiss(toastId);
          }
        },
      });
      return results.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 3,
    enabled: !searchedLicenseKey,
  });

  async function handleSearch(appliedFilters) {
    const keyResult = searchKeySchema.safeParse(searchRef.current.value);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['licenseKeysSearch', parsedKey, appliedFilters],
        queryFn: async () => {
          setIsSearching(true);
          // if previoesly searchedLicenseKey is null, then show skeleton loading
          // for all table, besides that, then show toast loading only
          let toastId;
          const activeToastId = grantRegenerateToastIdRef.current;

          if (searchedLicenseKey) {
            if (activeToastId) {
              toastId = toast.loading('Searching license keys...', { id: activeToastId });

              grantRegenerateToastIdRef.current = null;
            } else {
              toastId = toast.loading('Searching license keys...');
            }
          }

          return await safeFetch({
            url: addFiltersToURL(`/api/license-keys?sk=${parsedKey}`, appliedFilters),
            onFinally: () => {
              if (toastId && !activeToastId) {
                toast.dismiss(toastId);
              }

              setIsSearching(false);
            },
            defaultErrorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 10_000,
        gcTime: 10_000,
      });

      setSearchedLicenseKey(result.data);
    } catch (err) {
      setSearchError(err);
    }

    // reset rowSelection
    setRowSelection({});
  }

  function handleEnterSearch(e) {
    if (e.key === 'Enter') {
      handleSearch(filters);
    }
  }

  function handleClearSearchInput() {
    setRowSelection({});
    handlePaginationChange({
      ...pagination,
      pageIndex: 0,
    });
    setSearchedLicenseKey(null);
    setSearchError(null);
    searchRef.current.value = '';
  }

  function handleRefresh() {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
    queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });

    if (searchedLicenseKey) {
      handleSearch(filters);
    } else {
      // reset rowSelection
      setRowSelection({});
    }
  }

  async function handleDelete({ id }) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
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

    const licenseKey = queryClient.getQueryData([
      'licenseKeys',
      pagination.pageIndex,
      filters,
    ]);

    if (removeRes.status === 'success') {
      if (searchedLicenseKey) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.filter(slk => slk.id !== id),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== id);
        const newRowCount = licenseKey.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: licenseKey.rowCount,
        })) {
          queryClient.setQueryData(
            ['licenseKeys', pagination.pageIndex, filters],
            { items: newLicenseKeys, rowCount: newRowCount },
          );

          hasSuccessfulDeleteRef.current = true;
        } else {
          if (newLicenseKeys.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['licenseKeys', pagination.pageIndex, filters],
              exact: true,
            });

            queryClient.setQueryData(
              ['licenseKeys', pagination.pageIndex - 1, filters],
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
              ['licenseKeys', pagination.pageIndex, filters],
              { items: newLicenseKeys, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        }
      }
      
      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      toast.success(`License key deleted successfully`, { id: toastId });
    } else {
      toast.error(removeRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // For still invalidateQueries licenseKeys, when not in last page, last delete item fails, and 
    // at least one delete succeeded.
    if (
      !searchedLicenseKey &&
      deletingIdsRef.current.length === 0 &&
      hasSuccessfulDeleteRef.current
    ) {
      if (!isLastPage({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        rowCount: licenseKey.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulDeleteRef.current = false;
    }
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters.showRevoked || Object.keys(appliedFilters).length > 1) {
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }
  }

  function handleFilter(newFilters) {
    if (searchedLicenseKey) {
      handleSearch(newFilters);
    } else {
      handlePaginationChange({
        ...pagination,
        pageIndex: 0,
      });
    }

    // reset rowSelection
    setRowSelection({});

    // set filters for trigger refetch in normal mode
    setFilters(newFilters);
    syncIsFilterActive(newFilters);

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

  async function handleSetCanRegenerate() {
    const rowSelections = Object.keys(rowSelection);
    if (rowSelections.length <= 0) return false;

    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    setIsRegenerating(true);
    // show loading
    const toastId = toast.loading('Enabling regeneration...');

    // not use try/catch because in actions already using try/catch
    const setCanRegenerateRes = await setCanRegenerateKeys(rowSelections);

    if (setCanRegenerateRes.status === 'success') {
      grantRegenerateToastIdRef.current = toastId;

      await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });

      if (!searchedLicenseKey) {
        if (filters?.canRegenerate !== 'all') {
          const licenseKey = queryClient.getQueryData([
            'licenseKeys',
            pagination.pageIndex,
            filters,
          ]);
          const newLastPageIndex = Math.ceil(licenseKey.rowCount / cmsConfig.pagination.pageSize) - 1;

          if (pagination.pageIndex > newLastPageIndex) {
            // change pagination to new last page index
            setPagination(pagination => ({
              ...pagination,
              pageIndex: newLastPageIndex,
            }));
          }
        }
      } else {
        await handleSearch(filters);
      }

      setRowSelection({});

      if (setCanRegenerateRes.data.count > 0) {
        toast.success(
          `Regeneration enabled successfully for ${setCanRegenerateRes.data.count} license keys`,
          { id: toastId },
        );
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
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
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

    const licenseKey = queryClient.getQueryData([
      'licenseKeys',
      pagination.pageIndex,
      filters,
    ]);

    if (editRes.status === 'success') {
      if (searchedLicenseKey) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.filter(slk => slk.id !== id),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== id);
        const newRowCount = licenseKey.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: licenseKey.rowCount,
        })) {
          queryClient.setQueryData(
            ['licenseKeys', pagination.pageIndex, filters],
            { items: newLicenseKeys, rowCount: newRowCount },
          );

          hasSuccessfulRevokeRef.current = true;
        } else {
          if (newLicenseKeys.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['licenseKeys', pagination.pageIndex, filters],
              exact: true,
            });

            queryClient.setQueryData(
              ['licenseKeys', pagination.pageIndex - 1, filters],
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
              ['licenseKeys', pagination.pageIndex, filters],
              { items: newLicenseKeys, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });         
        }
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
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

    // For still invalidateQueries licenseKeys, when not in last page, last revoke/unrevoke item fails, and 
    // at least one revoke/unrevoke succeeded.
    if (
      !searchedLicenseKey &&
      updatingRevokeStatusIdsRef.current.length === 0 &&
      hasSuccessfulRevokeRef.current
    ) {
      // Double check page position in case user navigated 
      // while async operation was still in progress
      if (!isLastPage({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        rowCount: licenseKey.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulRevokeRef.current = false;
    }
  }

  async function handleResetDevice({ id }) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
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

    if (releaseRes.status === 'success') {
      if (searchedLicenseKey) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.map(slk => {
            if (slk.id === id) {
              return {
                ...slk,
                deviceId: null,
                updatedAt: releaseRes.data.updatedAt,
              };
            }
            return slk;
          }),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });       
      } else {
        if (pagination.pageIndex === 0) {
          queryClient.setQueryData(
            ['licenseKeys', pagination.pageIndex, filters],
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

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        } else {
          queryClient.setQueryData(
            ['licenseKeys', pagination.pageIndex, filters],
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
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      toast.success('License key device reset successfully.', { id: toastId });
    } else {
      toast.error(releaseRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // For still invalidateQueries licenseKeys, when not in first page, last reset device item fails, and 
    // at least one resetDevice succeeded.
    if (
      !searchedLicenseKey &&
      resetDeviceIdsRef.current.length === 0 &&
      hasSuccessfulResetDeviceRef.current
    ) {
      // Double check page position in case user navigated 
      // while async operation was still in progress
      if (pagination.pageIndex !== 0) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });       
      }

      hasSuccessfulResetDeviceRef.current = false;
    }
  }

  const hasSearched = !!searchedLicenseKey;
  let licenseKey;
  let activeError;

  if (searchedLicenseKey) {
    licenseKey = searchedLicenseKey;
  } else if (dataLK) {
    licenseKey = dataLK;
  }

  if (isErrorLK) {
    activeError = errorLK.message;
  } else if (searchError) {
    activeError = searchError.message;
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
    data: licenseKey?.items,
    columns,
    rowCount: licenseKey?.rowCount,
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
                disabled={isFetchingLK || isSearching}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>
            
            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingLK || isSearching}
            />

            {(filters?.canRegenerate !== 'yes' && !filters.showRevoked) && (
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto"
                disabled={isFetchingLK
                  || isSearching
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
            disabled={isFetchingLK || isSearching}
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

      {(shouldShowSkeletonLoading.current && isFetchingLK) || (isSearching && !searchedLicenseKey) ? (
        <TablePaginationSkeleton showPagination={!isSearching} />
      ) : activeError ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{activeError}</AlertTitle>
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
            data={licenseKey}
            table={table}
            pagination={pagination}
            isPlaceholderData={isPlaceholderDataLK}
            showNavigation={!hasSearched}
          />
        </>
      )}

      {(hasSearched && licenseKey?.isTooMany) ? (
        <p className="mt-5 text-muted-foreground text-sm"><b>Info</b>: If you haven't found the license key you're looking for, please use a more specific email!</p>
      ) : null}
      <p className="mt-5 text-muted-foreground text-sm"><b>Note</b>: <i>Activate</i> indicates that the license key has been used to activate the application</p>

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
