'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  AlertCircle,
  MoreHorizontal,
  Check,
  Minus,
  RotateCw,
} from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { PriceType, CurrencyCode, ProductStatus } from '@/constants/enums';
import {
  editProductPinned,
  editProductStatus,
  removeProduct,
} from '@/actions/product-actions';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/safe-fetch';
import Dot from '../icon/Dot';
import { formatDateTime } from '@/lib/format-date';
import { formatCurrency } from '@/lib/format-currency';
import { Badge } from '../ui/badge';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { localStorageGet } from '@/lib/local-storage';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import TableColumnVisibility from '../ui/table-column-visibility';
import DataTable from '../ui/data-table';
import TablePagination from '../ui/table-pagination';
import DeleteDialog from './delete-dialog';
import { cmsConfig } from '@/config/cms';
import { getStatusClasses } from '@/lib/utils';
import { deepEqual } from 'fast-equals';
import FiltersPopover from './filters-popover';

const defaultColumnVisibility = {
  category: false,
  releasedAt: true,
  admin: false,
  createdAt: false,
  updatedAt: false,
};

export default function ProductsTable({ isOwner }) {
  const queryClient = useQueryClient();

  // determine show table skeleton or not in
  const shouldShowSkeletonLoading = useRef(true);

  // filters state
  const [filters, setFilters] = useState({ status: 'active' });
  const [isFilterActive, setIsFilterActive] = useState(false);

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

  // delete dialog state
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const [updatingStatusIds, setUpdatingStatusIds] = useState([]);
  const [updatingPinnedIds, setUpdatingPinnedIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const {
    data: dataP,
    isFetching: isFetchingP,
    isError: isErrorP,
    error: errorP,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let toastId;

      if (!shouldShowSkeletonLoading.current) {
        toastId = toast.loading('Loading products...');
      }

      const results = await safeFetch({
        url: `/api/products?s=${filters.status}`,
        onFinally: () => {
          if (toastId) {
            toast.dismiss(toastId);
          }
        },
      });
      return results.data;
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
    staleTime: 1000 * 20,
    gcTime: 1000 * 60,
  });

  function handleRefresh() {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters.status !== 'active') {
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }
  }

  function handleFilter(newFilters) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // set filters for trigger refetch
    setFilters(newFilters);
    syncIsFilterActive(newFilters);
  }

  const handleEditPinned = useCallback(async (id, isPinned) => {
    // This is for add opacity-50 style to deleted row
    setUpdatingPinnedIds((prevIds) => [...prevIds, id]);
    // show loading
    const toastId = toast.loading(!isPinned ? 'Pinning product...' : 'Unpinning product...');

    const editRes = await editProductPinned(id, !isPinned);

    setUpdatingPinnedIds((prevIds) =>
      prevIds.filter((prevId) => prevId !== id)
    );

    if (editRes.status === 'success') {
      queryClient.setQueryData(['products', filters], (oldData) => {
        if (!oldData) return oldData;

        let updatedProduct = { ...oldData.items.find(data => data.id === editRes.data.id) };
        updatedProduct.updatedAt = editRes.data.updatedAt;
        updatedProduct.isPinned = !isPinned;

        const targetIndex = oldData.items.findLastIndex(data => data.isPinned);
        const filteredProducts = oldData.items.filter(data => data.id !== editRes.data.id);

        if (!isPinned) {
          return { items: [updatedProduct, ...filteredProducts] };
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return { items: filteredProducts };
        }
      });

      toast.success(
        !isPinned
          ? 'Product pinned successfully'
          : 'Product unpinned successfully',
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
        success: 'Product published successfully',
      },
      [ProductStatus.UNPUBLISHED]: {
        loading: 'Unpublishing product...',
        success: 'Product unpublished successfully',
      },
      [ProductStatus.INACTIVE]: {
        loading: 'Deactivating product...',
        success: 'Product deactivated successfully',
      },
    };

    // This is for add opacity-50 style to deleted row
    setUpdatingStatusIds((prevIds) => [...prevIds, id]);

    // show loading
    const toastId = toast.loading(toastText[newStatus].loading);

    const editRes = await editProductStatus(id, newStatus);

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

          let updatedProduct = { ...oldData.items.find(data => data.id === editRes.data.id) };
          updatedProduct.updatedAt = editRes.data.updatedAt;
          updatedProduct.status = newStatus;

          let targetIndex = oldData.items.findIndex(data => !data.isPinned);
          const filteredProducts = oldData.items.filter(data => data.id !== editRes.data.id);

          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return { items: filteredProducts };
        });
      }

      toast.success(toastText[newStatus].success, { id: toastId });
    } else {
      toast.error(editRes.message, { id: toastId });
    }   
  }, [filters]);

  async function handleDelete({ deleteData, toastId }) {
    // This is for add opacity-50 style to deleted row
    setDeletingIds((prevIds) => [...prevIds, deleteData.id]);

    const removeRes = await removeProduct(deleteData.id);

    setDeletingIds((prevIds) =>
      prevIds.filter((id) => id !== deleteData.id)
    );

    if (removeRes.status === 'success') {
      queryClient.setQueryData(['products', filters], (oldData) => {
        if (!oldData) return oldData;

        return {
          items: oldData.items.filter((data) => data.id !== deleteData.id),
        };
      });

      toast.success('Product deleted successfully', {
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
            <>
              <p>{row.original.admin?.firstName} {row.original.admin?.lastName}</p>
              <p className="text-sm text-zinc-600">{row.original.admin?.email}</p>
            </>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 focus-visible:ring-ring"
                disabled={
                  updatingPinnedIds.includes(row.original.id) ||
                  updatingStatusIds.includes(row.original.id) ||
                  deletingIds.includes(row.original.id)
                }
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-50">
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
              {currentStatus !== ProductStatus.INACTIVE && (
                <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                  <Link href={`/product/${row.original.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
              )}

              {currentStatus === ProductStatus.PUBLISHED && (
                <DropdownMenuItem
                  className="w-full text-base"
                  asChild
                >
                  <button
                    onClick={() => handleEditPinned(
                      row.original.id,
                      row.original.isPinned,
                    )}
                  >
                    {row.original.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                </DropdownMenuItem>
              )}

              {currentStatus === ProductStatus.UNPUBLISHED && (
                <>
                  <DropdownMenuItem
                    className="w-full text-base"
                    asChild
                  >
                    <button
                      onClick={() => handleEditStatus({
                        id: row.original.id,
                        newStatus: ProductStatus.PUBLISHED,
                        currentStatus: row.getValue('status'),
                      })}
                    >Publish</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full text-base focus:bg-orange-100 dark:focus:bg-orange-300/10"
                    asChild
                  >
                    <button
                      onClick={() => handleEditStatus({
                        id: row.original.id,
                        newStatus: ProductStatus.INACTIVE,
                        currentStatus: row.getValue('status'),
                      })}
                    >Deactive</button>
                  </DropdownMenuItem>
                </>
              )}

              {showUnpublishAction && (
                <DropdownMenuItem
                  className="w-full text-base"
                  asChild
                >
                  <button
                    onClick={() => handleEditStatus({
                      id: row.original.id,
                      newStatus: ProductStatus.UNPUBLISHED,
                      currentStatus: row.getValue('status'),
                    })}
                  >Unpublish</button>
                </DropdownMenuItem>
              )}

              {currentStatus !== ProductStatus.PUBLISHED && (
                <>
                  <DropdownMenuSeparator className="-mx-1.5" />
                  <DropdownMenuItem
                    className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                    asChild
                  >
                    <button
                      onClick={() => {
                        setDeleteData({ id: row.original.id, name: row.getValue('name') });
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
  ]);
  const table = useReactTable({
    data: dataP?.items,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex space-x-3 max-lg:flex-wrap max-lg:w-full gap-3">
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
                disabled={isFetchingP}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>

            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingP}
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

      {(shouldShowSkeletonLoading.current && isFetchingP) ? (
        <TablePaginationSkeleton showPagination={false} />
      ) : isErrorP ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorP.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <DataTable
            table={table}
            processingIds={[
              ...updatingPinnedIds,
              ...updatingStatusIds,
              ...deletingIds,
            ]}
          />
          <TablePagination
            data={dataP}
            showNavigation={false}
          />
        </>
      )}

      <p className="mt-5 inline-block text-muted-foreground text-sm"><b>Notes</b>:</p>
      <ul className="text-muted-foreground text-sm list-disc list-inside">
        <li>Pinned products will have higher display priority on the Products page and the homepage. A maximum of 4 products can be pinned.</li>
        <li>Prices are displayed using each currency’s standard number format.</li>
      </ul>

      <DeleteDialog
        onDelete={handleDelete}
        isOpenDeleteDialog={isOpenDeleteDialog}
        onIsOpenDeleteDialogChange={setIsOpenDeleteDialog}
        deleteData={deleteData}
        onDeleteDataChange={setDeleteData}
      />
    </>
  );
}
