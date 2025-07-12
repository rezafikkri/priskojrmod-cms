'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '../ui/label';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { PopoverClose } from '@radix-ui/react-popover';

export default function FiltersPopover({
  onFilter,
  isFilterActive,
  disabled,
}) {
  const [showBanned, setShowBanned] = useState(false);

  function handleClear() {
    set('all');
    setShowBanned(false);
    onFilter({ action: 'clear' });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-base px-3 py-1.5 h-auto"
          disabled={disabled}
        >
          <Filter />Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 space-y-5"
        onInteractOutside={(e) => {
          if (e.target?.hasAttribute('lang')) e.preventDefault();
        }}
      >
        <div className="space-y-2 flex items-start gap-4"> 
          <div className="flex-1"> 
            <Label className="text-base mb-1.5">Status</Label> 
            <p className="text-muted-foreground text-sm">Filter by banned status.</p> 
          </div> 
          <Select
            value={showBanned}
            onValueChange={(value) => setShowBanned(value)}
          > 
            <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent> 
              <SelectGroup> 
                <SelectItem className="text-base" value={false}>Active</SelectItem> 
                <SelectItem className="text-base" value={true}>Banned</SelectItem> 
              </SelectGroup> 
            </SelectContent> 
          </Select> 
        </div> 
        <div className="space-x-3 mt-6 flex"> 
          {isFilterActive && ( 
            <PopoverClose asChild>
              <Button 
                className="text-base px-3 py-1.5 h-auto inline-block" 
                variant="outline" 
                onClick={handleClear} 
              > 
                <X className="icon" /> Clear 
              </Button>
            </PopoverClose>
          )} 
          <PopoverClose asChild>
            <Button 
              className="text-base px-3 py-1.5 h-auto border border-primary" 
              onClick={() => onFilter({
                action: 'apply',
                newFilters: { showBanned },
              })} 
              disabled={!showBanned}
            > 
              Apply 
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>          
  );
}
