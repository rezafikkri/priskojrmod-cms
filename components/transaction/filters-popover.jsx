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
  filters,
  disabled,
}) {
  const [status, setStatus] = useState('all');

  function handleClear() {
    setStatus('all');
    onFilter(null);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-base px-3 py-1.5 h-auto relative inline-block"
          disabled={disabled}
        >
          <Filter className="icon" /> Filter
          {filters && (
            <span className="absolute top-0 right-0 inline-block size-2.5 rounded-full bg-primary dark:bg-green-500 -mt-1 -me-1" />
          )}
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
            <p className="text-muted-foreground text-sm">Filter by transaction status</p> 
          </div> 
          <Select
            value={status}
            onValueChange={(value) => setStatus(value)}
          > 
            <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent> 
              <SelectGroup> 
                <SelectItem className="text-base" value="all">All</SelectItem> 
                <SelectItem className="text-base" value="pending">Pending</SelectItem> 
                <SelectItem className="text-base" value="paid">Paid</SelectItem> 
                <SelectItem className="text-base" value="cancelled">Cancelled</SelectItem> 
                <SelectItem className="text-base" value="refund">Refund</SelectItem> 
              </SelectGroup> 
            </SelectContent> 
          </Select> 
        </div> 
        <div className="space-x-3 mt-6 flex"> 
          {filters && ( 
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
              onClick={() => onFilter({ status })} 
              disabled={status === 'all'}
            > 
              Apply 
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>          
  );
}
