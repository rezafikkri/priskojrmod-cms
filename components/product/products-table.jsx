'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  Minus,
  RotateCw,
} from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PriceType, CurrencyCode, ProductStatus } from '@/constants/enums';
import {
  editProductPinned,
  editProductStatus,
  removeProduct,
} from '@/actions/product-actions';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/safe-fetch';
import { formatDateTime } from '@/lib/format-date';
import { formatCurrency } from '@/lib/format-currency';
import { Badge } from '../ui/badge';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { localStorageGet } from '@/lib/local-storage';
import TableColumnVisibility from '../ui/table-column-visibility';
import DataTable from '../ui/data-table';
import DeleteDialog from './delete-dialog';
import { cmsConfig } from '@/config/cms';
import { getStatusClasses } from '@/lib/utils';
import FiltersPopover from './filters-popover';
import { useDialog } from '@/hooks/use-dialog';
import { useCheckQueryStale } from '@/hooks/use-check-query-stale';
import { deepEqual } from 'fast-equals';
import TableErrorAlert from '../ui/table-error-alert';
import { useStableTopLoader } from '@/hooks/use-stable-top-loader';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableSkeleton from '../loadings/table-skeleton';
import TableResultCount from '../ui/table-result-count';
import TableTwoLineCell from '../ui/table-two-line-cell';
import { callAction } from '@/lib/call-action';

const defaultColumnVisibility = {
  category: false,
  releasedAt: true,
  admin: false,
  createdAt: false,
  updatedAt: false,
};
const STALE_TIME = 1000 * 20;

export default function ProductsTable({ isOwner }) {
  const queryClient = useQueryClient();
  const isQueryStale = useCheckQueryStale();
  const { start: startProgress, done: doneProgress } = useStableTopLoader();

  // filters state
  const [filters, setFilters] = useState({ status: 'active' });
  // Tracks user-triggered refetches.
  // Controls progress bar visibility and disables related UI buttons while fetching.
  // 'refresh' | 'filter' | null (null = no toast shown)
  const [fetchAction, setFetchAction] = useState(null);

  // table state
  const columnVisibilityStorageKey = 'products:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorageGet(columnVisibilityStorageKey);
    if (saved) {
      if (!isOwner && saved.admin) {
        saved.admin = false;
      }

      return saved;
    }

    return defaultColumnVisibility;
  });

  const [priceCurrency, setPriceCurrency] = useState(cmsConfig.defaults.currency);

  // dialog state
  const {
    data: deleteData,
    isOpen: isOpenDeleteDialog,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();

  const [updatingStatusIds, setUpdatingStatusIds] = useState([]);
  const [updatingPinnedIds, setUpdatingPinnedIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const {
    data: dataP,
    isPending: isPendingP,
    isRefetching: isRefetchingP,
    isFetching: isFetchingP,
    isError: isErrorP,
    error: errorP,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: async ({ signal }) => {
      const results = await safeFetch({
        url: `/api/products?ps=${filters.status}`,
        signal,
      });
      return results?.data;
    },
    select: (product) => ({
      items: product.items.map(product => {
        let newProduct = { ...product };

        // mapping prices
        if (newProduct.priceType === PriceType.PAID) {
          const prices = newProduct.variants.flatMap(variant => variant.prices);
          newProduct.prices = prices.reduce((acc, { currencyCode, price }) => {
            if (!acc[currencyCode]) {
              acc[currencyCode] = { min: price, max: price };
            } else {
              if (acc[currencyCode].min > price) acc[currencyCode].min = price;
              if (acc[currencyCode].max < price) acc[currencyCode].max = price;
            }
            return acc;
          }, {});
        }
        delete newProduct.variants;

        // mapping releasedAt
        newProduct.releasedAt = newProduct.versions[0].releasedAt;
        delete newProduct.versions;

        return newProduct;
      }),
    }),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });

  // manage toast loading
  useEffect(() => {
    if (isRefetchingP) {
      startProgress();
    } else if (!isRefetchingP) {
      doneProgress();
    }
  }, [isRefetchingP]);

  // reset fetchAction
  useEffect(() => {
    if (!isFetchingP) {
      setFetchAction(null);
    }
  }, [isFetchingP]);

  function handleRefresh() {
    setFetchAction('refresh');
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  function handleFilter(newFilters) {
    const queryKey = ['products', newFilters];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      setFetchAction('filter');

      if (deepEqual(filters, newFilters)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }

    // set filters for trigger refetch
    setFilters(newFilters);
  }

  const handleEditPinned = useCallback(async (id, isPinned) => {
    setUpdatingPinnedIds((prevIds) => [...prevIds, id]);
    // show loading
    const toastId = toast.loading(!isPinned ? 'Pinning product...' : 'Unpinning product...');

    const editRes = await callAction(() => editProductPinned(id, !isPinned));

    setUpdatingPinnedIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (editRes.status === 'success') {
      queryClient.setQueryData(['products', filters], (oldData) => {
        if (!oldData) return oldData;

        const targetProduct = oldData.items.find(item => item.id === editRes.data.id);
        if (!targetProduct) return oldData;

        const updatedProduct = {
          ...targetProduct,
          updatedAt: editRes.data.updatedAt,
          isPinned: !isPinned,
        };

        const targetIndex = oldData.items.findLastIndex(item => item.isPinned);
        const filteredProducts = oldData.items.filter(item => item.id !== editRes.data.id);

        if (!isPinned) {
          return { items: [updatedProduct, ...filteredProducts] };
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return { items: filteredProducts };
        }
      });

      toast.success(
        !isPinned
          ? 'Product pinned successfully.'
          : 'Product unpinned successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }, [filters]);

  const handleEditStatus = useCallback(async ({ id, newStatus, currentStatus }) => {
    const toastText = {
      [ProductStatus.PUBLISHED]: {
        loading: 'Publishing product...',
        success: 'Product published successfully.',
      },
      [ProductStatus.UNPUBLISHED]: {
        loading: 'Unpublishing product...',
        success: 'Product unpublished successfully.',
      },
      [ProductStatus.INACTIVE]: {
        loading: 'Deactivating product...',
        success: 'Product deactivated successfully.',
      },
    };

    setUpdatingStatusIds((prevIds) => [...prevIds, id]);

    // show loading
    const toastId = toast.loading(toastText[newStatus].loading);

    const editRes = await callAction(() => editProductStatus(id, newStatus));

    setUpdatingStatusIds((prevIds) => prevIds.filter((prevId) => prevId !== id));

    if (editRes.status === 'success') {
      if (newStatus === ProductStatus.INACTIVE || currentStatus === ProductStatus.INACTIVE) {
        queryClient.setQueryData(['products', filters], (oldData) => {
          if (!oldData) return oldData;

          return {
            items: oldData.items.filter((data) => data.id !== id),
          };
        });

        queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'none' });
      } else {
        queryClient.setQueryData(['products', filters], (oldData) => {
          if (!oldData) return oldData;

          const targetProduct = oldData.items.find(item => item.id === editRes.data.id);
          if (!targetProduct) return oldData;

          const updatedProduct = {
            ...targetProduct,
            updatedAt: editRes.data.updatedAt,
            status: newStatus,
          };

          const targetIndex = oldData.items.findIndex(item => !item.isPinned);
          const filteredProducts = oldData.items.filter(item => item.id !== editRes.data.id);

          filteredProducts.splice(targetIndex, 0, updatedProduct);

          return { items: filteredProducts };
        });
      }

      toast.success(toastText[newStatus].success, { id: toastId });
    } else {
      toast.error(editRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }   
  }, [filters]);

  async function handleDelete({ id }) {
    setDeletingIds((prevIds) => [...prevIds, id]);
    // show loading
    const toastId = toast.loading('Deleting product...');

    const removeRes = await callAction(() => removeProduct(id));

    setDeletingIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (removeRes.status === 'success') {
      queryClient.setQueryData(['products', filters], (oldData) => {
        if (!oldData) return oldData;

        return {
          items: oldData.items.filter((data) => data.id !== id),
        };
      });

      toast.success('Product deleted successfully.', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }

  // TABLE definition
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableHiding: false,
      cell: ({ row }) => {
        if (row.original.isPinned) {
          return (
            <>
              <span>{row.getValue('name')}</span>
              <Badge
                variant="secondary"
                className="bg-green-50 dark:bg-green-900 ms-3 text-xs text-green-700 dark:text-green-300"
              >
                Pinned
              </Badge>
            </>
          );
        }
        return row.getValue('name');
      },
    },
    {
      id: 'category',
      accessorKey: 'category.name',
      header: 'Category',
    },
    {
      accessorKey: 'prices',
      enableHiding: false,
      header: () => (
        <>
          <span>Price</span>
          <div className="ms-4 inline-block space-x-1">
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.IDR ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.IDR)}
            >
              IDR
            </Button>
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.USD ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.USD)}
            >
              USD
            </Button>
          </div>
        </>
      ),
      cell: ({ row }) => {
        if (row.original.priceType === PriceType.PAID) {
          const prices = row.getValue('prices')[priceCurrency];
          const min = formatCurrency({
            value: prices.min,
            currencyCode: priceCurrency,
          });
          const max = formatCurrency({
            value: prices.max,
            currencyCode: priceCurrency,
          });

          if (!prices) return <Minus className="size-4 text-zinc-300" />;
          if (prices.min === prices.max) {
            return <span className="tabular-nums">{min}</span>;
          }
          
          return <span className="tabular-nums">{min}&ndash;{max}</span>;
        }
        
        return PriceType.FREE[0].toUpperCase() + PriceType.FREE.substring(1);
      },
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
      accessorKey: 'releasedAt',
      header: 'Released At',
      cell: ({ row }) => formatDateTime(row.getValue('releasedAt')),
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => (
        <div>
          {row.original.admin?.isCurrentUser ? (
            <p>Myself</p>
          ) : (
            <TableTwoLineCell
              primary={row.original.admin?.firstName + ' ' + row.original.admin?.lastName}
              secondary={row.original.admin?.email}
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updatedAt')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const currentStatus = row.getValue('status');
        const showUnpublishAction = currentStatus === ProductStatus.INACTIVE ||
          (!row.original.isPinned && currentStatus === ProductStatus.PUBLISHED);

        return (
          <TableActionDropdown
            disabled={
              updatingPinnedIds.includes(row.original.id) ||
              updatingStatusIds.includes(row.original.id) ||
              deletingIds.includes(row.original.id)
            }
          >
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            {currentStatus !== ProductStatus.INACTIVE && (
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link href={`/product/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
            )}
            {currentStatus === ProductStatus.PUBLISHED && (
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => handleEditPinned(
                  row.original.id,
                  row.original.isPinned,
                )}>
                  {row.original.isPinned ? 'Unpin' : 'Pin'}
                </button>
              </DropdownMenuItem>
            )}
            {currentStatus === ProductStatus.UNPUBLISHED && (
              <>
                <DropdownMenuItem className="w-full text-base" asChild>
                  <button onClick={() => handleEditStatus({
                    id: row.original.id,
                    newStatus: ProductStatus.PUBLISHED,
                    currentStatus: row.getValue('status'),
                  })}>
                    Publish
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full text-base" asChild>
                  <button onClick={() => handleEditStatus({
                    id: row.original.id,
                    newStatus: ProductStatus.INACTIVE,
                    currentStatus: row.getValue('status'),
                  })}>
                    Deactivate
                  </button>
                </DropdownMenuItem>
              </>
            )}
            {showUnpublishAction && (
              <DropdownMenuItem className="w-full text-base" asChild>
                <button onClick={() => handleEditStatus({
                  id: row.original.id,
                  newStatus: ProductStatus.UNPUBLISHED,
                  currentStatus: row.getValue('status'),
                })}>
                  Unpublish
                </button>
              </DropdownMenuItem>
            )}
            {currentStatus !== ProductStatus.PUBLISHED && (
              <>
                <DropdownMenuSeparator className="-mx-1.5" />
                <DropdownMenuItem className="w-full text-base" asChild>
                  <button onClick={() => openDeleteDialog({
                    id: row.original.id,
                    name: row.getValue('name'),
                  })}>
                    Delete
                  </button>
                </DropdownMenuItem>
              </>
            )}
          </TableActionDropdown>
        );
      },
    }
  ], [
    priceCurrency,
    updatingPinnedIds,
    updatingStatusIds,
    deletingIds,
    handleEditPinned,
    handleEditStatus,
    openDeleteDialog,
  ]);

  const defaultData = useMemo(() => [], []);
  const table = useReactTable({
    data: dataP?.items ?? defaultData,
    columns,
    state: {
      columnVisibility,
    },
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex max-lg:flex-wrap max-lg:w-full gap-6">
          <TooltipWrapper text="Create product">
            <Button asChild variant="outline" className="h-auto inline-block text-base px-3 py-1.5">
              <Link href="/product/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex space-x-3">
            <TooltipWrapper text="Refresh">
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto inline-block"
                disabled={isPendingP || fetchAction === 'refresh'}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>

            <FiltersPopover
              onFilter={handleFilter}
              filters={filters}
              disabled={isPendingP || fetchAction === 'filter'}
            />
          </div>
        </div>

        <TableColumnVisibility
          table={table}
          defaultColumnVisibility={defaultColumnVisibility}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          storageKey={columnVisibilityStorageKey}
          filterFn={(column) =>
            column.id === 'admin'
              ? isOwner
              : true
          }
        />
      </div>

      {isPendingP
        ? <TableSkeleton />
        : (
          <>
            <TableErrorAlert
              isError={isErrorP}
              isRefetching={isRefetchingP}
              message={errorP?.message}
            />
            <DataTable table={table} />
            <TableResultCount data={dataP?.items} />
          </>
        )}

      <p className="mt-5 inline-block text-muted-foreground text-sm"><b>Notes</b>:</p>
      <ul className="text-muted-foreground text-sm list-disc list-inside">
        <li>Pinned products will have higher display priority on the Products page and the homepage. A maximum of 4 products can be pinned.</li>
        <li>Prices are displayed using each currency’s standard number format.</li>
      </ul>

      <DeleteDialog
        onDelete={handleDelete}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        deleteData={deleteData}
      />
    </>
  );
}
