'use client';

import { generatePageInfo } from '@/lib/utils';
import { Button } from '../ui/button';

export default function TablePagination({
  licenseKey,
  table,
  pagination,
  isPlaceholderData,
  hasSearched,
}) {
  // generate pageInfo like this: 1-10 of 20
  const currentCount = licenseKey?.licenseKeys?.length ?? 0;
  const pageInfo = generatePageInfo({
    pageIndex: pagination.pageIndex,
    hasSearched,
    totalCount: licenseKey?.rowCount ?? 0,
    currentCount,
  });

  return currentCount > 0 ? (
    <div className="flex max-md:flex-col max-md:items-start gap-3 md:gap-5 md:justify-between mt-4 items-center">
      <span className="text-muted-foreground">{pageInfo}</span>
      {!hasSearched ? (
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-auto text-base px-3 py-1.5"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={isPlaceholderData || !table.getCanNextPage()}
            className="h-auto text-base px-3 py-1.5"
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  ) : null;
}
