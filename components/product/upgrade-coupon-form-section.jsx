'use client';

import TooltipWrapper from '../ui/tooltip-wrapper';
import { toast } from 'sonner';
import {
  Trash,
  Loader2,
  Percent,
  AlertCircle,
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
import { removeProductUpgradeCoupon } from '@/actions/product-actions';
import { cmsConfig } from '@/config/cms';
import InfoCircle from '../icon/info-circle';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';

export default function UpgradeCouponFormSection({
  form,
  dbVersion,
  basic,
  handlers,
  disabled,
}) {
  const {
    onIncrementPending,
    onDecrementPending,
  } = handlers;
  const upgradeCouponErrors = form.formState.errors.upgradeCoupon;
  const [isDeleting, setIsDeleting] = useState(false);

  // form.getValues() is fine here since delete always triggers a re-render (state update),
  // keeping this value in sync. Switch to useWatch if that assumption changes.
  const upgradeCoupon = form.getValues('upgradeCoupon');

  async function handleDelete() {
    if (upgradeCoupon.id) {
      // set pending state for disabled prev next button and show loading
      onIncrementPending();
      setIsDeleting(true);
      const removeRes = await removeProductUpgradeCoupon(upgradeCoupon.id, basic.id);

      if (removeRes.status === 'success') {
        form.clearErrors('upgradeCoupon');
        form.setValue('upgradeCoupon', { code: '', discount: '', expiredAt: '' });
      } else {
        toast.error(removeRes.message, {
          duration: cmsConfig.toast.duration.error
        });
      }

      // set pending state for enabled prev next button and hide loading
      onDecrementPending();
      setIsDeleting(false);
    }
  }

  function clearErrorsIfAllEmpty() {
    const { code, discount, expiredAt } = form.getValues('upgradeCoupon');
    const isAllEmpty = !code && !discount && !expiredAt;
    const hasErrors = upgradeCouponErrors?.code
      || upgradeCouponErrors?.discount
      || upgradeCouponErrors?.expiredAt;
    
    if (isAllEmpty && hasErrors) {
      form.clearErrors(['upgradeCoupon.code', 'upgradeCoupon.discount', 'upgradeCoupon.expiredAt']);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <h3 className="text-lg font-bold mb-0">Upgrade Coupon</h3>
        <h4 className="text-zinc-700 dark:text-zinc-300/80">
          Optional. Provides a discount for previous buyers when purchasing product upgrades.
        </h4>

        {upgradeCouponErrors?.root && (
          <Alert variant="destructive" className="border-destructive/50 text-base items-baseline">
            <AlertCircle />
            <AlertTitle className="line-clamp-0">{upgradeCouponErrors.root.message}</AlertTitle>
          </Alert>
        )}

        {upgradeCoupon.id && basic.version !== dbVersion && (
          <Alert className="text-base items-baseline">
            <InfoCircle />
            <AlertTitle className="line-clamp-0">
              Because the version has been changed, this upgrade coupon will be automatically removed once you click Update.
            </AlertTitle>
          </Alert>
        )}

        <div className="flex items-center gap-5">
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-3">
              <FormField
                control={form.control}
                name="upgradeCoupon.code"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-base">Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          clearErrorsIfAllEmpty();
                        }}
                        disabled={isDeleting || disabled}
                        className="md:text-base h-auto px-3 py-1.5 shadow-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the upgrade coupon code in UPPERCASE (e.g. SAVE-20-NOW)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upgradeCoupon.discount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-base">Discount</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            clearErrorsIfAllEmpty();
                          }}
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
                    <FormDescription>Enter discount value in percent (e.g. 10 means 10%)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="upgradeCoupon.expiredAt"
              render={({ field }) =>
                <ExpiredAtInput
                  field={{
                    ...field,
                    onChange: (e) => {
                      field.onChange(e);
                      clearErrorsIfAllEmpty();
                    },
                  }}
                  description="Select the expiration date and time of the upgrade coupon."
                  disabled={isDeleting || disabled}
                />
              }
            />
          </div>

          {upgradeCoupon.id && (
            <>
              <Separator orientation="vertical" className="h-30!" />

              <div className="relative inline-block">
                <TooltipWrapper text="Delete upgrade coupon" background="bg-destructive">
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
      </section>
    </>
  );
}
