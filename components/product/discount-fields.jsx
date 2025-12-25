'use client';

import TooltipWrapper from '../ui/tooltip-wrapper';
import { toast } from 'sonner';
import {
  Trash,
  Loader2,
  Percent,
} from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useState } from 'react';
import ExpiredAtInput from './expired-at-input';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { removeProductDiscount } from '@/actions/product-actions';

export default function DiscountFields({
  form,
  basic,
  handlers,
  disabled,
}) {
  const {
    onIncrementPending,
    onDecrementPending,
  } = handlers;
  const [isDeleting, setIsDeleting] = useState(false);
  const discount = form.getValues('discount');

  async function handleDelete() {
    if (discount.id) {
      // set pending state for disabled prev next button and show loading
      onIncrementPending();
      setIsDeleting(true);
      const removeRes = await removeProductDiscount(discount.id, basic.id);

      if (removeRes.status === 'success') {
        form.setValue('discount', { value: '', expired_at: '' });
      } else {
        toast.error(removeRes.message);
      }
      // set pending state for enabled prev next button and hide loading
      onDecrementPending();
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="flex-1 space-y-6">
        <FormField
          control={form.control}
          name="discount.value"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-base">Value</FormLabel>
              <div className="flex">
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={isDeleting || disabled}
                    className="shadow-none md:text-base h-auto px-3 py-1.5 rounded-e-none z-1"
                  />
                </FormControl>
                <span
                  className={`inline-block md:text-base h-auto px-3 py-1.5 border border-s-0 rounded-e-md bg-zinc-50 dark:bg-zinc-900/50 ${(isDeleting || disabled) ? 'opacity-50' : ''}`}
                >
                  <Percent className="icon size-4" />
                </span>
              </div>
              <FormDescription>Enter discount percentage (e.g. 10 for 10%)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount.expired_at"
          render={({ field }) =>
            <ExpiredAtInput
              field={field}
              description="Select the expiration date and time of the discount."
              disabled={isDeleting || disabled}
            />
          }
        />
      </div>

      {discount.id && (
        <>
          <Separator orientation="vertical" className="h-30!" />

          <div className="relative inline-block">
            <TooltipWrapper text="Delete discount" background="bg-destructive">
              <Button
                type="button"
                variant="secondary"
                className={`hover:text-destructive dark:hover:text-red-500/90 ${isDeleting ? 'disabled:opacity-100' : ''}`}
                onClick={handleDelete}
                disabled={isDeleting || disabled}
              >
                <Trash className={`icon ${isDeleting ? 'opacity-0' : ''}`} />
              </Button>
            </TooltipWrapper>               
            {isDeleting &&
              <div
                className="absolute h-full top-0 left-0 right-0 flex justify-center items-center"
              >
                <Loader2 className="animate-spin" size={16} />
              </div>
            }
          </div>
        </>
      )}
    </div>
  );
}
