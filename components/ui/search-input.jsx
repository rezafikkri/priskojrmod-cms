import { Search, X } from 'lucide-react';
import { Input } from './input';
import TooltipWrapper from './tooltip-wrapper';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function SearchInput({
  className,
  placeholder,
  disabled,
  hasSearched,
  onSearch,
  onEnterSearch,
  onClearSearch,
}) {
  const [searchKey, setSearchKey] = useState('');

  return (
    <div className={cn('flex shadow-xs rounded-md', className)}>
      <div className="relative flex items-center -me-[1px] z-1 flex-1">
        <Input
          placeholder={placeholder}
          className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
          onChange={(e) => setSearchKey(e.target.value)}
          value={searchKey}
          disabled={disabled}
          onKeyUp={onEnterSearch}
        />
        {hasSearched ? (
          <TooltipWrapper text="Clear search input">
            <Button
              className="absolute right-2 w-4 h-5 p-0 z-1"
              variant="ghost"
              onClick={() => {
                setSearchKey('');
                onClearSearch();
              }}
              disabled={disabled}
            >
              <X className="size-4" />
            </Button>
          </TooltipWrapper>
        ) : null}
      </div>
      <Button
        variant="secondary"
        className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
        disabled={disabled}
        onClick={() => onSearch(searchKey)}
      >
        <Search />
      </Button>
    </div>
  );
}
