import { cmsConfig } from '@/config/cms';

export function changeToLastValidPage({
  rowCount,
  pagination,
  searchKey,
  filters,
  updateFetchAction,
  queryClient,
  baseQueryKey,
  setPagination,
  lastPageIndex,
}) {
  let newLastPageIndex = Math.ceil(rowCount / cmsConfig.pagination.pageSize) - 1;
  if (newLastPageIndex < 0) newLastPageIndex = 0;

  if (pagination.pageIndex > newLastPageIndex) {
    console.dir('change page to last valid page');
    const newPagination = { ...pagination, pageIndex: newLastPageIndex };
    const queryKey = [
      baseQueryKey,
      newPagination,
      filters,
      searchKey,
    ];

    queryClient.setQueryData(
      queryKey,
      (oldData) => {
        if (!oldData) return oldData;

        return { ...oldData, rowCount };
      },
    );

    // invalidate again for only the new last page for refetch
    queryClient.invalidateQueries({ queryKey, exact: true });
    // change page to new last page index
    updateFetchAction('paginate');
    setPagination(newPagination);

    console.dir('lastPageIndex', lastPageIndex);
    console.dir('newLastPageIndex', newLastPageIndex);
    // remove query for some page that no have data
    for (let i = lastPageIndex; i > newLastPageIndex; i--) {
      console.dir('remove page ke-' + i);
      queryClient.removeQueries({
        queryKey: [ baseQueryKey, { ...pagination, pageIndex: i }, filters, searchKey ],
        exact: true,
      });
    }

    return true;
  }

  return false;
}
