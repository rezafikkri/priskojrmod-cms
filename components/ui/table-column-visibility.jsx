'use client';

import { deepEqual } from 'fast-equals';
import { localStorageGet, localStorageRemove, localStorageSet } from '@/lib/local-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Columns } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Button } from '@/components/ui/button';

export default function TableColumnVisibility({
  table,
  defaultColumnVisibility,
  columnVisibility,
  onColumnVisibilityChange,
  storageKey,
  filterFn,
}) {
  let columns = table.getAllColumns().filter((column) => 
    column.id === 'select'
      ? false
      : column.getCanHide(),
  );

  if (filterFn) {
    columns = columns.filter(filterFn);
  }

  function handleResetColumnVisibility() {
    const resetState = { ...defaultColumnVisibility };
    if ('select' in columnVisibility) {
      resetState.select = columnVisibility.select;
    }
    onColumnVisibilityChange(resetState);
    localStorageRemove(storageKey);
  }

  function camelToTitle(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (match) => match.toUpperCase())
  }

  function handleColumnVisibilityChange(column, value) {
    column.toggleVisibility(!!value);

    const savedColumnVisibility = localStorageGet(storageKey);
    let newColumnVisibility;
    if (savedColumnVisibility) {
      newColumnVisibility = {
        ...savedColumnVisibility,
        [column.id]: !!value,
      };
    } else {
      newColumnVisibility = {
        ...defaultColumnVisibility,
        [column.id]: !!value,
      };
    }
    localStorageSet(storageKey, newColumnVisibility);
  }

  const { select, ...comparableVisibility } = columnVisibility;
  const hasUserCustomization = !deepEqual(defaultColumnVisibility, comparableVisibility);

  return (
    <DropdownMenu modal={false}>
      <TooltipWrapper text="Manage columns">
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="text-base px-3 py-1.5 h-auto inline-block">
            <Columns className="icon" />
          </Button>
        </DropdownMenuTrigger>
      </TooltipWrapper>
      <DropdownMenuContent align="end" className="min-w-50" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel className="text-muted-foreground text-[15px]">Columns</DropdownMenuLabel>
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="text-base hover:cursor-pointer"
            checked={column.getIsVisible()}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(value) => handleColumnVisibilityChange(column, value)}
          >
            {camelToTitle(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
        {hasUserCustomization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-base w-full">
              <button onClick={handleResetColumnVisibility}>Reset to default</button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
