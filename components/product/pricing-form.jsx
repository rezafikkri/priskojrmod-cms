'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { CurrencyCode, PriceType } from '@/constants/enums';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createProductPricingSchema, editProductPricingSchema } from '@/lib/validators/product-validator';
import { toast } from 'sonner';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { Fragment, useMemo } from 'react';
import { addProduct, editProduct } from '@/actions/product-actions';
import PriceFields from './price-fields';
import DiscountFields from './discount-fields';
import UpgradeCouponFields from './upgrade-coupon-fields';
import useEditPendingTracker from '@/hooks/use-edit-pending-tracker';
import { Separator } from '../ui/separator';
import { useQueryClient } from '@tanstack/react-query';
import { cmsConfig } from '@/config/cms';
import { Alert, AlertTitle } from '../ui/alert';

export default function PricingForm({
  onPrevStep,
  onResetStep,
  mode = 'create',
}) {
  const pricing = useProductFormStore(state => state.form.pricing);
  const setPricing = useProductFormStore(state => state.setPricing);
  const clearDraft = useProductFormStore(state => state.clearDraft);
  const basic = useProductFormStore(state => state.form.basic);
  const content = useProductFormStore(state => state.form.content);
  const extras = useProductFormStore(state => state.form.extras);
  let pricingSchema;

  // edit mode only
  let setExtras;
  let setBasic;
  let setContent;
  let setVersionStatus;
  let setReference;
  let dbVersion;

  if (mode === 'create') {
    pricingSchema = createProductPricingSchema;
  } else {
    setExtras = useProductFormStore(state => state.setExtras);
    setBasic = useProductFormStore(state => state.setBasic);
    setContent = useProductFormStore(state => state.setContent);
    pricingSchema = editProductPricingSchema;
    setVersionStatus = useProductFormStore(state => state.setVersionStatus);
    setReference = useProductFormStore(state => state.setReference);
    dbVersion = useProductFormStore(state => state.reference.dbVersion);
  }

  const queryClient = useQueryClient();

  function syncPrices(pricing) {
    let newPrices = [];

    if (basic.priceType === PriceType.PAID) {
      for (const variant of extras.variants) {
        // This is for updating prices. It ensures that when the admin goes back to the previous step 
        // and edits a variant name, the new variant name will be reflected here.
        // It also handles the case when the admin deletes some variants in the previous step — 
        // this function will ignore prices from deleted variants, 
        // so their associated prices will appear as removed.
        for (const price of pricing.prices) {
          if (price.variantId === (variant.id ?? variant.dbId)) {
            newPrices.push({
              ...price,
              variantName: variant.name,
            });
          }
        }
        
        // if new variant exist, or priceType changed to paid (that mean, each variant doesn't have
        // any prices), then add prices for each variant to newPrices array. 
        if (!pricing.prices.some(price => (variant.id ?? variant.dbId) === price.variantId)) {
          newPrices.push({
            variantId: variant.id ?? variant.dbId,
            variantName: variant.name,
            currencies: [
              { price: '', currencyCode: CurrencyCode.IDR },
              { price: '', currencyCode: CurrencyCode.USD },
            ],
          });
        }
      }
    }

    return { ...pricing, prices: newPrices };
  }

  const initialDefaultValues = useMemo(() => syncPrices(pricing), []);
  const form = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: initialDefaultValues,
  });
  const isSubmitting = form.formState.isSubmitting;
  const {
    fields: prices,
  } = useFieldArray({
    control: form.control,
    name: 'prices',
  });

  const {
    incrementPending,
    decrementPending,
    isBlocking,
  } = useEditPendingTracker();

  function getExpiredAtEpoch(date) {
    if (date instanceof Date) {
      return Math.floor(date.getTime() / 1000);
    }
    return date;
  }

  async function handleSubmit(data) {
    // validate prices: if currencyCode = IDR, then only integer, if USD allow decimal
    let isError = false;
    let fieldNameToFocus = null;

    data.prices.forEach((price, i) => {
      price.currencies.forEach((currency, j) => {
        if (currency.currencyCode === CurrencyCode.IDR && !Number.isInteger(currency.price)) {
          const fieldName = `prices.${i}.currencies.${j}.price`;

          if (!fieldNameToFocus) fieldNameToFocus = fieldName;
          form.setError(fieldName, { message: 'Must not contain decimals' }, { shouldFocus: true });
          isError = true;
        }
      });
    });

    if (isError) {
      // Use requestAnimationFrame to ensure focus happens 
      // right after the DOM update but before the next paint.
      // This avoids timing issues where the input ref is not yet ready.
      requestAnimationFrame(() => {
        form.setFocus(fieldNameToFocus);
      });
      return;
    }

    let product = {
      ...basic,
      ...content,
      ...extras,
    };

    if (mode === 'create') {
      product.status = data.status;
    }
    
    // if price type == paid
    if (product.priceType === PriceType.PAID) {
      product.variants = product.variants.map(variant => {
        let newVariant = { ...variant };

        for (const price of data.prices) {
          if ((variant.id ?? variant.dbId) === price.variantId) {
            newVariant.prices = price.currencies;
            break;
          }
        }

        delete newVariant.id;
        return newVariant;
      });

      product.discount = {
        ...data.discount,
        expiredAt: data.discount.expiredAt !== ''
          ? getExpiredAtEpoch(data.discount.expiredAt)
          : '',
      };

      if (mode === 'edit') {
        product.upgradeCoupon = {
          ...data.upgradeCoupon,
          expiredAt: data.upgradeCoupon.expiredAt !== ''
            ? getExpiredAtEpoch(data.upgradeCoupon.expiredAt)
            : '',
        };
      }
    } else {
      product.variants = product.variants.map(variant => {
        let newVariant = { ...variant };
        delete newVariant.id;
        return newVariant;
      });
    }

    let saveRes;
    if (mode === 'create') {
      saveRes = await addProduct(product);
    } else {
      saveRes = await editProduct(product);
    }

    if (saveRes.status === 'success') {
      if (mode === 'create') {
        // reset step and form
        clearDraft();
        onResetStep();
        toast.success('Product created successfully.');
      } else {
        // if success, set basic, content, extras and pricing data, like id, etc.
        setBasic({
          ...basic,
          versionId: saveRes.data.basic.versionId,
        });

        if (saveRes.data.content.versionTranslationId) {
          setContent({
            ...content,
            versionTranslationId: saveRes.data.content.versionTranslationId,
          });
        }

        setExtras(saveRes.data.extras);

        let newPricing = {
          prices: saveRes.data.pricing.prices,
          discount: data.discount,
          upgradeCoupon: data.upgradeCoupon,
        };

        if (!data.discount.id && data.discount.value) {
          // add id from db to store
          newPricing.discount = {
            id: saveRes.data.pricing.discount.id,
            ...data.discount,
          };

        } else if (data.discount.id && !data.discount.value) {
          // reset discount
          newPricing.discount = { value: '', expiredAt: '' };
        }

        let successMessage = 'Product updated successfully.';
        if (!data.upgradeCoupon.id && data.upgradeCoupon.code) {
          newPricing.upgradeCoupon = {
            id: saveRes.data.pricing.upgradeCoupon.id,
            ...data.upgradeCoupon,
          };
        } else if (data.upgradeCoupon.id && (!data.upgradeCoupon.code || dbVersion !== basic.version)) {
          newPricing.upgradeCoupon = { code: '', discount: '', expiredAt: '' };
          successMessage += ' The old upgrade coupon has been removed because a new version was released.';
        }

        setPricing(newPricing);
        form.reset(newPricing);

        // reset versionStatus state and update reference (dbVersion, dsb)
        setVersionStatus('pristine');
        setReference({
          dbPriceType: basic.priceType,
          dbVersion: basic.version,
          dbChangelog: content.changelog,
        });

        toast.success(successMessage);
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
    } else {
      toast.error(saveRes.message, {
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  function handlePrev() {
    const data = form.getValues();
    setPricing(data);
    onPrevStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
        {basic.priceType === PriceType.PAID && (
          <>
            <section className="space-y-6 mb-9">
              <h3 className="text-lg font-bold mb-0">Prices</h3>
              <h4 className="text-zinc-700 dark:text-zinc-300/80">
                Each variant has its own price in two currencies, IDR and USD.
              </h4>

              {prices.map((price, index) => (
                <Fragment key={price.variantId}>
                  <PriceFields
                    price={price}
                    name={`prices.${index}.currencies`}
                    form={form}
                  />
                  {index < prices.length - 1 && (
                    <div className="pe-15">
                      <Separator />
                    </div>
                  )}
                </Fragment>
              ))}
            </section>
            <Separator />
            <section className="space-y-6 mb-9">
              <h3 className="text-lg font-bold mb-0">Discount</h3>
              <h4 className="text-zinc-700 dark:text-zinc-300/80">
                Optional. The discount percentage to apply to the product price.
              </h4>

              <DiscountFields
                form={form}
                basic={basic}
                handlers={{
                  onIncrementPending: incrementPending,
                  onDecrementPending: decrementPending,
                }}
                disabled={isSubmitting}
              />
            </section>
            {mode === 'edit' && (
              <>
                <Separator />
                <section className="space-y-6">
                  <h3 className="text-lg font-bold mb-0">Upgrade Coupon</h3>
                  <h4 className="text-zinc-700 dark:text-zinc-300/80">
                    Optional. Provides a discount for previous buyers when purchasing product upgrades.
                  </h4>

                  <UpgradeCouponFields
                    form={form}
                    basic={basic}
                    handlers={{
                      onIncrementPending: incrementPending,
                      onDecrementPending: decrementPending,
                    }}
                    disabled={isSubmitting}
                  />
                </section>
              </>
            )}
          </>
        )}

        {mode === 'create' && (
          <>
            {basic.priceType === PriceType.PAID && (
              <Separator />
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="gap-6 mb-9">
                  <FormLabel className="text-lg font-bold">Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center space-x-4">
                        <RadioGroupItem value="unpublished" id="unpublished" />
                        <Label htmlFor="unpublished" className="text-base font-medium">Publish Later</Label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <RadioGroupItem value="published" id="published" />
                        <Label htmlFor="published" className="text-base">Publish Now</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button
          variant="outline"
          className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5"
          onClick={handlePrev}
          disabled={isBlocking}
        >
          <ArrowLeft className="icon" /> Previous
        </Button>
        <div className="relative inline-block">
          <Button
            type="submit"
            className={`h-auto text-base px-3 py-1.5 ${isSubmitting ? 'transition-none disabled:opacity-100' : ''} border border-primary inline-block`}
            disabled={isSubmitting || isBlocking}
          >
            <span className={isSubmitting ? 'opacity-0' : ''}>
              {mode === 'create' ? 'Create' : 'Update'}
            </span>
          </Button>
          {isSubmitting && (
            <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary-foreground" size={16} />
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
