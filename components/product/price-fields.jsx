'use client';

import { CurrencyCode } from '@/constants/enums';
import { Fragment } from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

export default function PriceFields({
  prices,
  form,
}) {
  const isSubmitting = form.formState.isSubmitting;
  // to detect previous variant in prices loop
  let prevVariant = null;

  return (
    prices.map((price, index) => {
      if (prevVariant !== price.variantName) {
        prevVariant = price.variantName;
      } else {
        return null;
      }

      return (
        <Fragment key={price.id}>
          <FormItem>
            <FormLabel className="text-base">Variant</FormLabel>
            <p>{price.variantName}</p>
          </FormItem>

          <div className="flex gap-3 items-start">
            <FormField
              control={form.control}
              name={`prices.${index}.price`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">{CurrencyCode.IDR} Price</FormLabel>
                  <p className="text-sm text-zinc-500">
                    Preview: IDR {Number(field.value).toLocaleString('id-ID')}
                  </p>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      className="md:text-base h-auto px-3 py-1.5 shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter the product price in {CurrencyCode.IDR}.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prices.${index + 1}.price`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">{CurrencyCode.USD} Price</FormLabel>
                  <p className="text-sm text-zinc-500">
                    Preview: USD {Number(field.value).toLocaleString('en-US')}
                  </p>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      className="md:text-base h-auto px-3 py-1.5 shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter the product price in {CurrencyCode.USD}.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {index !== prices.length - 2 && (
            <div className="pe-15">
              <Separator />
            </div>
          )}
        </Fragment>
      );
    })
  );
}
