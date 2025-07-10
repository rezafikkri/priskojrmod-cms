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
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { PopoverClose } from '@radix-ui/react-popover';

export default function FiltersPopover({
  onFilter,
  isFilterActive,
  disabled,
}) {
  const queryClient = useQueryClient();
  const [secretKeys, setSecretKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [secretKeyId, setSecretKeyId] = useState('all');
  const [canRegenerate, setCanRegenerate] = useState('all');

  function handleClear() {
    setSecretKeyId('all');
    setCanRegenerate('all');
    onFilter({ action: 'clear' });
  }

  // handler for select app_name onOpenChange event
  async function handleOpenChange(open) {
    if (open) {
      setIsLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ['secretKeys'],
          queryFn: async () => {
            const res = await fetch(`/api/secret-keys`);
            const resJson = await res.json();
            return resJson;
          },
          staleTime: 1000 * 60,
          gcTime: 1000 * 60 * 3,
        }); 
        setSecretKeys(result.data);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
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
            <Label className="text-base mb-1.5">App Name</Label> 
            <p className="text-muted-foreground text-sm">Filter by secret key app name.</p> 
          </div> 
          <Select
            value={secretKeyId}
            onOpenChange={handleOpenChange}
            onValueChange={(value) => setSecretKeyId(value)}
          > 
            <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30 min-h-9.5"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}> 
              <SelectItem className="text-base" value="all">All</SelectItem> 
              {secretKeys.map(secretKey => (
                <SelectItem className="text-base" value={secretKey.id} key={secretKey.id}>
                  {secretKey.app_name}
                </SelectItem>
              ))}
              {isLoading && (
                <Skeleton className="h-[30px] mt-1 rounded-sm" />
              )}
            </SelectContent> 
          </Select> 
        </div> 
        <div className="space-y-2 flex items-start gap-4"> 
          <div className="flex-1"> 
            <Label className="text-base mb-1.5">Can Regenerate</Label> 
            <p className="text-muted-foreground text-sm">Filter by regenerate status.</p> 
          </div> 
          <Select
            value={canRegenerate}
            onValueChange={(value) => setCanRegenerate(value)}
          > 
            <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent> 
              <SelectGroup> 
                <SelectItem className="text-base" value="all">All</SelectItem> 
                <SelectItem className="text-base" value="yes">Yes</SelectItem> 
                <SelectItem className="text-base" value="no">No</SelectItem> 
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
                newFilters: { secretKeyId, canRegenerate },
              })} 
              disabled={secretKeyId === 'all' & canRegenerate === 'all'}
            > 
              Apply 
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>          
  );
}
