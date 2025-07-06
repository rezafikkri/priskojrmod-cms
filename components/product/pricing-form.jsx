'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { CurrencyCode, PriceType } from '@/constants/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createProductPricingSchema, editProductPricingSchema } from '@/lib/validators/product-validator';
import { toast } from 'sonner';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { useMemo } from 'react';
import { addProduct, editProduct } from '@/actions/product-actions';
import PriceFields from './price-fields';
import DiscountFields from './discount-fields';
import CouponFields from './coupon-fields';
import useEditPendingTracker from '@/hooks/use-edit-pending-tracker';
import { Separator } from '../ui/separator';

export default function PricingForm({
  onPrevStep,
  onResetStep,
  mode = 'create',
}) {
  const pricing = useProductFormStore(state => state.pricing);
  const setPricing = useProductFormStore(state => state.setPricing);
  const clearDraft = useProductFormStore(state => state.clearDraft);
  const basic = useProductFormStore(state => state.basic);
  const content = useProductFormStore(state => state.content);
  const extras = useProductFormStore(state => state.extras);
  let pricingSchema;

  // edit mode only
  let setExtras;

  if (mode === 'create') {
    pricingSchema = createProductPricingSchema;
  } else {
    setExtras = useProductFormStore(state => state.setExtras);
    pricingSchema = editProductPricingSchema;
  }

  function getDefaultPrices(priceType) {
    if (priceType === PriceType.FREE) return [];

    let prices = [];
    for (const variant of extras.variants) {
      prices.push({
        variantId: variant.id ?? variant.dbId,
        variantName: variant.name,
        price: '',
        currency_code: CurrencyCode.IDR,
      });
      prices.push({
        variantId: variant.id ?? variant.dbId,
        variantName: variant.name,
        price: '',
        currency_code: CurrencyCode.USD,
      });
    }
    return prices;
  }

  function syncPrices(pricing) {
    let newPrices = [];

    if (pricing.price_type === PriceType.PAID) {
      for (const variant of extras.variants) {
        // This is for updating prices. It ensures that when the admin goes back to the previous step 
        // and edits a variant name, the new variant name will be reflected here.
        // It also handles the case when the admin deletes some variants in the previous step — 
        // this function will ignore prices from deleted variants, 
        // so their associated prices will appear as removed.
        for (const [index, price] of pricing.prices.entries()) {
          if (price.variantId === (variant.id ?? variant.dbId)) {
            newPrices.push({
              ...price,
              variantName: variant.name,
            });
            newPrices.push({
              ...pricing.prices[index + 1],
              variantName: variant.name,
            });
            break;
          }
        }
        
        // if new variant exist, then add to newPrices array.
        if (variant.id && !pricing.prices.some(price => variant.id === price.variantId)) {
          newPrices.push({
            variantId: variant.id,
            variantName: variant.name,
            price: '',
            currency_code: CurrencyCode.IDR,
          });
          newPrices.push({
            variantId: variant.id,
            variantName: variant.name,
            price: '',
            currency_code: CurrencyCode.USD,
          });
        }
      }
    }

    if (newPrices.length > 0) {
      return { ...pricing, prices: newPrices };
    }
    return pricing;
  }

  const initialDefaultValues = useMemo(() => syncPrices(pricing), []);
  const form = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: initialDefaultValues,
  });
  const isSubmitting = form.formState.isSubmitting;
  const {
    fields: prices,
    replace: replacePrices,
  } = useFieldArray({
    control: form.control,
    name: 'prices',
  });

  const {
    incrementPending,
    decrementPending,
    isBlocking,
  } = useEditPendingTracker();

  function handlePriceTypeChange({ selectedValue, field }) {
    field.onChange(selectedValue);
    replacePrices(getDefaultPrices(selectedValue));
  }

  function getExpiredAtEpoch(date) {
    if (date instanceof Date) {
      return Math.floor(date.getTime() / 1000);
    }
    return date;
  }

  async function handleSubmit(data) {
    let product = {
      ...basic,
      ...content,
      ...extras,
      price_type: data.price_type,
    };

    if (mode === 'create') {
      product.is_published = data.is_published;
    } else {
      product.should_update_released_at = data.should_update_released_at;
    }

    // if price type == paid
    if (data.price_type === PriceType.PAID) {
      product.variants = product.variants.map(variant => {
        let newVariant = { ...variant, prices: [] };

        for (const [i, price] of data.prices.entries()) {
          if ((variant.id ?? variant.dbId) === price.variantId) {
            let priceIDR = {
              price: price.price,
              currency_code: price.currency_code,
            };
            if (price.id) priceIDR.id = price.id;

            let priceUSD = {
              price: data.prices[i + 1].price,
              currency_code: data.prices[i + 1].currency_code,
            };
            if (data.prices[i + 1].id) priceUSD.id = data.prices[i + 1].id;

            newVariant.prices.push(priceIDR);
            newVariant.prices.push(priceUSD);

            break;
          }
        }

        delete newVariant.id;
        return newVariant;
      });

      product.discount = {
        ...data.discount,
        expired_at: data.discount.expired_at !== ''
          ? getExpiredAtEpoch(data.discount.expired_at)
          : '',
      };
      product.coupon = {
        ...data.coupon,
        expired_at: data.coupon.expired_at !== ''
          ? getExpiredAtEpoch(data.coupon.expired_at)
          : '',
      };
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
        // if success, set extras and pricing data, like id, etc.
        setExtras(saveRes.data.extras);

        let newPricing = {
          price_type: data.price_type,
          prices: saveRes.data.pricing.prices,
          should_update_released_at: false,
          discount: data.discount,
          coupon: data.coupon,
        };

        if (!data.discount.id && data.discount.value) {
          // add id from db to store
          newPricing.discount = {
            id: saveRes.data.pricing.discount.id,
            ...data.discount,
          };

        } else if (data.discount.id && !data.discount.value) {
          // reset discount
          newPricing.discount = { value: '', expired_at: '' };
        }

        if (!data.coupon.id && data.coupon.code) {
          newPricing.coupon = {
            id: saveRes.data.pricing.coupon.id,
            ...data.coupon,
          };
        } else if (data.coupon.id && !data.coupon.code) {
          newPricing.coupon = { code: '', discount: '', expired_at: '' };
        }

        setPricing(newPricing);
        form.reset(newPricing);
        toast.success('Product updated successfully.');
      }
    } else {
      toast.error(saveRes.message);
    }
  }

  function handlePrev() {
    const data = form.getValues();
    setPricing(data);
    onPrevStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
        {(mode === 'edit' && pricing.price_type === PriceType.PAID) ? (
          <FormItem>
            <FormLabel className="text-base">Price Type</FormLabel>
            <p className="capitalize">{pricing.price_type}</p>
            <FormDescription>This is a paid product. Price type cannot be changed.</FormDescription>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name="price_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Price Type</FormLabel>
                <Select
                  onValueChange={(priceType) => handlePriceTypeChange({ selectedValue: priceType, field: field })}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="shadow-none text-base h-auto! px-3 py-1.5 w-full capitalize">
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem className="text-base capitalize" value={PriceType.FREE}>
                      {PriceType.FREE}
                    </SelectItem>
                    <SelectItem className="text-base capitalize" value={PriceType.PAID}>
                      {PriceType.PAID}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select whether this product is free or paid.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.getValues('price_type') === PriceType.PAID && (
          <>
            <Separator />
            <section className="space-y-6 mb-9">
              <h3 className="text-lg font-bold mb-0">Prices</h3>
              <h4 className="text-zinc-700 dark:text-zinc-300/80">
                Each variant has its own price in two currencies, USD and IDR.
              </h4>

              <PriceFields prices={prices} form={form} />
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
            <Separator />
            <section className="space-y-6 mb-9">
              <h3 className="text-lg font-bold mb-0">Coupon</h3>
              <h4 className="text-zinc-700 dark:text-zinc-300/80">
                Optional. Provides a discount for previous buyers when purchasing product upgrades.
              </h4>

              <CouponFields
                form={form}
                basic={basic}
                handlers={{
                  onIncrementPending: incrementPending,
                  onDecrementPending: decrementPending,
                }}
                disabled={isSubmitting}
              />
            </section>
            <Separator />
          </>
        )}

        {mode === 'create' ? (
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="flex space-x-2 items-start">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-2">
                  <FormLabel className="text-base leading-none">Publish</FormLabel>
                  <FormDescription>
                    Make this product visible on the website.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="should_update_released_at"
            render={({ field }) => (
              <FormItem className="flex space-x-2 items-start">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-2">
                  <FormLabel className="text-base leading-none">Update "Released At"</FormLabel>
                  <FormDescription>
                    Check this if you want to change the product’s "Released At" value.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
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
