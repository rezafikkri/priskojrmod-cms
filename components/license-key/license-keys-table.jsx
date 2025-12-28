'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isLastPage } from '@/lib/utils';
import { AlertCircle, Search, X, RotateCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Input } from '../ui/input';
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

const defaultColumnVisibility = {
  app_name: true,
  regenerated_at: false,
  created_at: false,
  updated_at: false,
};

export default function LicenseKeysTable() {
  const queryClient = useQueryClient();

  // seearc state
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLicenseKey, setSearchedLicenseKey] = useState(null);
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

  // delete, revoke/unrevoke and reset device dialog state
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [editRevokeStatusData, setEditRevokeStatusData] = useState(null);
  const [isOpenEditRevokeStatusDialog, setIsOpenEditRevokeStatusDialog] = useState(false);
  const [resetDeviceData, setResetDeviceData] = useState(null);
  const [isOpenResetDeviceDialog, setIsOpenResetDeviceDialog] = useState(false);

  // deleting ids and revoke/unrevoke state
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingRevokeStatusIds, setUpdatingRevokeStatusIds] = useState([]);
  const [resetDeviceIds, setResetDeviceIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or revoke/unrevoke succeed.
  const hasSuccessfulDeleteRef = useRef(false);
  const hasSuccessfulRevokeRef = useRef(false);
  const hasSuccessfulResetDeviceRef = useRef(false);

  // This `useRef` is here to **always keep the newest `searchedLicenseKey and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedLicenseKey and more state` value, which is called a "stale closure" problem.
  const searchedLicenseKeyRef = useRef(searchedLicenseKey);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const deletingIdsRef = useRef(deletingIds);
  const updatingRevokeStatusIdsRef = useRef(updatingRevokeStatusIds);
  const resetDeviceIdsRef = useRef(resetDeviceIds);

  useEffect(() => {
    searchedLicenseKeyRef.current = searchedLicenseKey;
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [searchedLicenseKey, filters, pagination]);

  // set can regenerate state
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Used to persist toast ID for the grant regenerate action,
  // allowing us to update the loading toast instead of showing a new one.
  const grantRegenerateToastIdRef = useRef(null);

  // add secretKeyId and canRegenerate filters
  function addFiltersToURL(url, appliedFilters) {
    let newUrl = url + `&ir=${appliedFilters.showRevoked}`;

    if (appliedFilters.secretKeyId && appliedFilters.secretKeyId !== 'all') {
      newUrl += `&ski=${appliedFilters.secretKeyId}`;
    }
    if (appliedFilters.secretKeyId && appliedFilters.canRegenerate !== 'all') {
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
          toastId = toast.loading('Loading license keys...', { id: activeToastId });

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
            errorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 10_000,
        gcTime: 10_000,
      });

      setSearchedLicenseKey(result.data);
      // reset rowSelection
      setRowSelection({});
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
    setRowSelection({});
    handlePaginationChange({
      ...pagination,
      pageIndex: 0,
    });
    setSearchedLicenseKey(null);
    searchRef.current.value = '';
  }

  function handleRefresh() {
    // not show table skeleton loading
    if (!searchedLicenseKey && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }

    queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
    queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });

    if (searchedLicenseKey) {
      handleSearch(filters);
    } else {
      // reset rowSelection
      setRowSelection({});
    }
  }

  async function handleDelete({ deleteData, toastId }) {
    // not show table skeleton loading
    if (!searchedLicenseKey && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to deleted row
    setDeletingIds((prev) => {
      const newIds = [...prev, deleteData.id];
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const removeRes = await removeLicenseKey(deleteData.id);

    setDeletingIds((prev) => {
      const newIds = prev.filter(id => id !== deleteData.id);
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData([
      'licenseKeys',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (removeRes.status === 'success') {
      if (searchedLicenseKeyRef.current) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.filter(slk => slk.id !== deleteData.id),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== deleteData.id);
        const newRowCount = licenseKey.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: licenseKey.rowCount,
        })) {
          queryClient.setQueryData(
            ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
            { items: newLicenseKeys, rowCount: newRowCount },
          );

          if (!hasSuccessfulDeleteRef.current) {
            hasSuccessfulDeleteRef.current = true;
          }
        } else {
          if (newLicenseKeys.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['licenseKeys', paginationRef.current.pageIndex - 1, filtersRef.current],
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
              ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              { items: newLicenseKeys, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        }
      }
      
      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(deleteData.id in prev)) return prev;
        const { [deleteData.id]:_, ...next } = prev;
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
      !searchedLicenseKeyRef.current &&
      deletingIdsRef.current.length === 0 &&
      hasSuccessfulDeleteRef.current
    ) {
      if (!isLastPage({
        pageIndex: paginationRef.current.pageIndex,
        pageSize: paginationRef.current.pageSize,
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
      if (columnVisibility.app_name) {
        setColumnVisibility(prev => ({
          ...prev,
          app_name: false,
        }));
      }
    } else if (!columnVisibility.app_name) {
      setColumnVisibility(prev => ({
        ...prev,
        app_name: true,
      }));
    }
  }

  async function handleSetCanRegenerate() {
    const rowSelections = Object.keys(rowSelection);
    if (rowSelections.length <= 0) return false;

    // not show table skeleton loading
    if (!searchedLicenseKey && shouldShowSkeletonLoading.current) {
      shouldShowSkeletonLoading.current = false;
    }

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
        if (filtersRef.current?.canRegenerate !== 'all') {
          const licenseKey = queryClient.getQueryData([
            'licenseKeys',
            paginationRef.current.pageIndex,
            filtersRef.current,
          ]);
          const newLastPageIndex = Math.ceil(licenseKey.rowCount / cmsConfig.pagination.pageSize) - 1;

          if (paginationRef.current.pageIndex > newLastPageIndex) {
            // change pagination to new last page index
            setPagination(pagination => ({
              ...pagination,
              pageIndex: newLastPageIndex,
            }));
          }
        }
      } else {
        await handleSearch(filtersRef.current);
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

  async function handleEditRevokeStatus({ editRevokeStatusData, toastId }) {
    // not show table skeleton loading
    if (!searchedLicenseKey) {
      shouldShowSkeletonLoading.current = false;
    }

    // This is for add opacity-50 style to updated revoke status row
    setUpdatingRevokeStatusIds((prev) => {
      const newIds = [...prev, editRevokeStatusData.id];
      updatingRevokeStatusIdsRef.current = newIds;
      return newIds;
    });

    const editRes = await editLicenseKeyRevokeStatus(editRevokeStatusData.id, !editRevokeStatusData.isRevoked);

    setUpdatingRevokeStatusIds((prev) => {
      const newIds = prev.filter(id => id !== editRevokeStatusData.id);
      updatingRevokeStatusIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData([
      'licenseKeys',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (editRes.status === 'success') {
      if (searchedLicenseKeyRef.current) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.filter(slk => slk.id !== editRevokeStatusData.id),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const newLicenseKeys = licenseKey.items.filter(lk => lk.id !== editRevokeStatusData.id);
        const newRowCount = licenseKey.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: licenseKey.rowCount,
        })) {
          queryClient.setQueryData(
            ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
            { items: newLicenseKeys, rowCount: newRowCount },
          );

          hasSuccessfulRevokeRef.current = true;
        } else {
          if (newLicenseKeys.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['licenseKeys', paginationRef.current.pageIndex - 1, filtersRef.current],
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
              ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              { items: newLicenseKeys, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });         
        }
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(editRevokeStatusData.id in prev)) return prev;
        const { [editRevokeStatusData.id]:_, ...next } = prev;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      toast.success(
        editRevokeStatusData.isRevoked
          ? 'License key unrevoked successfully'
          : 'License key revoked successfully',
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
      !searchedLicenseKeyRef.current &&
      updatingRevokeStatusIdsRef.current.length === 0 &&
      hasSuccessfulRevokeRef.current
    ) {
      if (!isLastPage({
        pageIndex: paginationRef.current.pageIndex,
        pageSize: paginationRef.current.pageSize,
        rowCount: licenseKey.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulRevokeRef.current = false;
    }
  }

  async function handleResetDevice({ resetData, toastId }) {
     // not show table skeleton loading
    if (!searchedLicenseKey) {
      shouldShowSkeletonLoading.current = false;
    }   

    // This is for add opacity-50 style target row
    setResetDeviceIds((prev) => {
      const newIds = [...prev, resetData.id];
      resetDeviceIdsRef.current = newIds;
      return newIds;
    });

    const releaseRes = await releaseDevice(resetData.id);

    setResetDeviceIds((prev) => {
      const newIds = prev.filter(id => id !== resetData.id);
      resetDeviceIdsRef.current = newIds;
      return newIds;
    });

    if (releaseRes.status === 'success') {
      if (searchedLicenseKeyRef.current) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          items: prevLicenseKey.items.map(slk => {
            if (slk.id === resetData.id) {
              return {
                ...slk,
                device_id: null,
                updated_at: releaseRes.data.updated_at,
              };
            }
            return slk;
          }),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });       
      } else {
        if (paginationRef.current.pageIndex === 0) {
          queryClient.setQueryData(
            ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;
              
              const targetLicenseKey = oldData.items.find(lk => lk.id === resetData.id);

              if (targetLicenseKey) {
                return {
                  ...oldData,
                  items: [
                    {
                      ...targetLicenseKey,
                      device_id: null,
                      updated_at: releaseRes.data.updated_at,
                    },
                    ...oldData.items.filter(lk => lk.id !== resetData.id),
                  ],
                };
              }
              return oldData;
            },
          );

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        } else {
          queryClient.setQueryData(
            ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                items: oldData.items.filter(lk => lk.id !== resetData.id),
              };
            },
          );
          
          hasSuccessfulResetDeviceRef.current = true;
        }
      }

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(resetData.id in prev)) return prev;
        const { [resetData.id]:_, ...next } = prev;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      toast.success('License key device reset successfully', { id: toastId });
    } else {
      toast.error(releaseRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // For still invalidateQueries licenseKeys, when not in first page, last reset device item fails, and 
    // at least one resetDevice succeeded.
    if (
      !searchedLicenseKeyRef.current &&
      resetDeviceIdsRef.current.length === 0 &&
      hasSuccessfulResetDeviceRef.current
    ) {
      if (paginationRef.current.pageIndex !== 0) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });       
      }

      hasSuccessfulResetDeviceRef.current = false;
    }
  }

  const hasSearched = !!searchedLicenseKey;
  let licenseKey;
  if (searchedLicenseKey) {
    licenseKey = searchedLicenseKey;
  } else if (dataLK) {
    licenseKey = dataLK;
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
      accessorKey: 'email',
      header: 'Email',
      enableHiding: false,
    },
    {
      accessorKey: 'app_name',
      header: 'App Name',
    },
    {
      accessorKey: 'expired_at',
      enableHiding: false,
      header: () => 'Expired At',
      cell: ({ row }) => formatDateTime(row.getValue('expired_at')),
    },
    {
      accessorKey: 'regenerated_at',
      header: () => 'Regenerated At',
      cell: ({ row }) => 
        row.getValue('regenerated_at')
          ? formatDateTime(row.getValue('regenerated_at'))
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

            {row.original.device_id && (
              <DropdownMenuItem
                className="w-full text-base focus:bg-orange-100 dark:focus:bg-orange-300/10"
                asChild
              >
                <button
                  onClick={() => {
                    setResetDeviceData({
                      id: row.original.id,
                      email: row.getValue('email'),
                      appName: row.getValue('app_name'),
                    });
                    setIsOpenResetDeviceDialog(true);
                  }}
                >
                  Reset device
                </button>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="w-full text-base focus:bg-orange-100 dark:focus:bg-orange-300/10"
              asChild
            >
              <button
                onClick={() => {
                  setEditRevokeStatusData({
                    id: row.original.id,
                    email: row.getValue('email'),
                    appName: row.getValue('app_name'),
                    isRevoked: row.original.is_revoked,
                  });
                  setIsOpenEditRevokeStatusDialog(true);
                }}
              >
                {row.original.is_revoked ? 'Unrevoke' : 'Revoke'}
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5" />
            <DropdownMenuItem
              className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
              asChild
            >
              <button
                onClick={() => {
                  setDeleteData({
                    id: row.original.id,
                    email: row.getValue('email'),
                    appName: row.getValue('app_name'),
                  });
                  setIsOpenDeleteDialog(true);
                }}
              >
                Delete
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [deletingIds, updatingRevokeStatusIds, resetDeviceIds]);
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
        <div className="flex space-x-3 max-lg:flex-wrap max-lg:w-full gap-3">
          <TooltipWrapper text="Create license key">
            <Button asChild variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
              <Link href="/license-key/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex space-x-3">
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
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <div className="flex shadow-xs rounded-md flex-1">
            <div className="relative flex items-center -me-[1px] z-1 flex-1">
              <Input
                placeholder="Search with email..."
                className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
                disabled={isFetchingLK || isSearching}
                ref={searchRef}
                onKeyUp={handleEnterSearch}
                autoComplete="off"
              />
              {searchedLicenseKey ? (
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 w-4 h-5 p-0 z-1"
                    variant="ghost"
                    onClick={handleClearSearchInput}
                    disabled={isFetchingLK || isSearching}
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipWrapper>
              ) : null}
            </div>
            <Button
              variant="secondary"
              className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
              disabled={isFetchingLK || isSearching}
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

      {(shouldShowSkeletonLoading.current && isFetchingLK) || (isSearching && !searchedLicenseKey) ? (
        <TablePaginationSkeleton showPagination={!isSearching} />
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
        onIsOpenChange={setIsOpenDeleteDialog}
        onDeleteDataChange={setDeleteData}
        deleteData={deleteData}
      />
      <EditRevokeStatusDialog
        onEditRevokeStatus={handleEditRevokeStatus}
        isOpen={isOpenEditRevokeStatusDialog}
        onIsOpenChange={setIsOpenEditRevokeStatusDialog}
        onEditRevokeStatusDataChange={setEditRevokeStatusData}
        editRevokeStatusData={editRevokeStatusData}
      />
      <ResetDeviceDialog
        onReset={handleResetDevice}
        isOpen={isOpenResetDeviceDialog}
        onIsOpenChange={setIsOpenResetDeviceDialog}
        onResetDataChange={setResetDeviceData}
        resetData={resetDeviceData}
      />
    </>
  );
}
