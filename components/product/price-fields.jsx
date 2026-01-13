'use client';

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
import { useFieldArray } from 'react-hook-form';
import { formatCurrency } from '@/lib/format-currency';

export default function PriceFields({
  price,
  name,
  form,
}) {
  const isSubmitting = form.formState.isSubmitting;
  const { fields: currencies } = useFieldArray({
    control: form.control,
    name,
  });

  return (
    <Fragment>
      <FormItem>
        <FormLabel className="text-base">Variant</FormLabel>
        <p>{price.variantName}</p>
      </FormItem>

      <div className="flex gap-3 items-start">
        {currencies.map((currency, index) => (
          <FormField
            key={currency.id}
            control={form.control}
            name={`${name}.${index}.price`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">{currency.currencyCode} price</FormLabel>
                <p className="text-sm text-zinc-500">
                  Preview: {formatCurrency({
                    value: Number(field.value),
                    currencyCode: currency.currencyCode,
                  })}
                </p>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isSubmitting}
                    className="md:text-base h-auto px-3 py-1.5 shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Enter the product price in {currency.currencyCode}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </Fragment>
  );
}
