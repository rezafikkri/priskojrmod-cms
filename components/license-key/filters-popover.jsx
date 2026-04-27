'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '../ui/label';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PopoverClose } from '@radix-ui/react-popover';
import { safeFetch } from '@/lib/safe-fetch';

export default function FiltersPopover({
  onFilter,
  filters,
  disabled,
}) {
  const queryClient = useQueryClient();

  // secret key id state
  const [isLoading, setIsLoading] = useState(false);
  const [secretKeyId, setSecretKeyId] = useState('all');
  const [error, setError] = useState(null);
  const [secretKeys, setSecretKeys] = useState([]);

  const [canRegenerate, setCanRegenerate] = useState('all');
  const [showRevoked, setShowRevoked] = useState(false);
  const isFilterActive = filters.showRevoked || Object.keys(filters).length > 1;

  function handleClear() {
    setSecretKeyId('all');
    setCanRegenerate('all');
    setShowRevoked(false);
    onFilter({ showRevoked: false });
  }

  // handler for select product/app name onOpenChange event
  async function handleOpenChange(open) {
    if (open) {
      setIsLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ['secretKeyOptions'],
          queryFn: async () => {
            const results = await safeFetch({
              url: '/api/secret-keys',
            });
            return results.data;
          },
          staleTime: 1000 * 30,
        }); 

        setError(null);
        setSecretKeys(result);
      } catch (err) {
        setError(err);
      }
      setIsLoading(false);
    }
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
          {isFilterActive && (
            <span className="absolute top-0 right-0 inline-block size-2.5 rounded-full bg-primary dark:bg-green-500 -mt-1 -me-1" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-90 space-y-5"
        onInteractOutside={(e) => {
          if (e.target?.hasAttribute('lang')) e.preventDefault();
        }}
      >
        <div className="space-y-2 flex items-start gap-4"> 
          <div className="flex-1"> 
            <Label className="text-base mb-1.5">App name</Label> 
            <p className="text-muted-foreground text-sm">Filter by secret key app name.</p> 
          </div> 
          <Select
            value={secretKeyId}
            onOpenChange={handleOpenChange}
            onValueChange={(value) => setSecretKeyId(value)}
          > 
            <div className="relative">
              <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30 min-h-9.5"> 
                <SelectValue /> 
              </SelectTrigger>
              {isLoading && (
                <span className="absolute right-1.5 bg-popover top-1 bottom-1 flex items-center px-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </span>
              )}
            </div> 
            <SelectContent
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="max-w-xs"
            > 
              {error && (
                <>
                  <div className="text-destructive px-2 py-1.5">{error.message}</div>
                  <SelectSeparator />
                </>
              )}
              <SelectItem className="text-base" value="all">All</SelectItem> 
              {secretKeys.map(secretKey => (
                <SelectItem className="text-base" value={secretKey.id} key={secretKey.id}>
                  {secretKey.product.name}
                </SelectItem>
              ))}
            </SelectContent> 
          </Select> 
        </div> 
        <div className="space-y-2 flex items-start gap-4"> 
          <div className="flex-1"> 
            <Label className="text-base mb-1.5">Revoked</Label> 
            <p className="text-muted-foreground text-sm">Filter by revoked condition.</p> 
          </div> 
          <Select
            value={showRevoked}
            onValueChange={(value) => setShowRevoked(value)}
          > 
            <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-30"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent> 
              <SelectGroup> 
                <SelectItem className="text-base" value={false}>No</SelectItem> 
                <SelectItem className="text-base" value={true}>Yes</SelectItem> 
              </SelectGroup> 
            </SelectContent> 
          </Select> 
        </div> 
        <div className="space-y-2 flex items-start gap-4"> 
          <div className="flex-1"> 
            <Label className="text-base mb-1.5">Can regenerate</Label> 
            <p className="text-muted-foreground text-sm">Filter by can regenerate condition.</p> 
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
              onClick={() => onFilter({ secretKeyId, canRegenerate, showRevoked })} 
              disabled={secretKeyId === 'all' && canRegenerate === 'all' && !showRevoked}
            > 
              Apply 
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>          
  );
}
