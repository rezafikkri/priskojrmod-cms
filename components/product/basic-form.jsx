'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createProductBasicSchema, editProductBasicSchema } from '@/lib/validators/product-validator';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { PriceType } from '@/constants/enums';
import MainFileFields from './main-file-fields';
import { isSemverFormat } from '@/lib/utils';

export default function BasicForm({
  onNextStep,
  onPricingStepVisibility,
  categories,
  owners,
  licenses,
  mode = 'create',
}) {
  const basic = useProductFormStore(state => state.basic);
  const setBasic = useProductFormStore(state => state.setBasic);
  const clearDraft = useProductFormStore(state => state.clearDraft);
  const defaultValues = {
    ...basic,
    category_id: basic.category_id.toString(),
    owner_id: basic.owner_id.toString(),
    license_id: basic.license_id.toString(),
  };
  let basicSchema;

  if (mode === 'create') {
    basicSchema = createProductBasicSchema;
  } else {
    basicSchema = editProductBasicSchema;
  }

  const form = useForm({
    resolver: zodResolver(basicSchema),
    defaultValues,
  });

  const applicationCategoryId = categories.find((category) => category.slug === 'application')?.id ?? null;

  function handleNext(data) {
    let isError = false;

    // validate drive_file_id, download_link, and version
    if (data.category_id === applicationCategoryId || data.price_type === PriceType.FREE) {
      if (data.download_link === '') {
        form.setError('download_link', { message: 'Can\'t be empty' });
        isError = true;
      }
    }
    
    if (data.category_id === applicationCategoryId) {
      if (!isSemverFormat(data.version)) {
        form.setError('version', { message: 'Must follow simplified semantic versioning' });
        isError = true;
      }
    }

    if (isError) return;

    onPricingStepVisibility(data.price_type);
    setBasic(data);
    onNextStep();
  }

  function beforeNext(e) {
    if (
      form.getValues('category_id') === applicationCategoryId.toString() ||
      form.getValues('price_type') === PriceType.FREE
    ) {
      form.setValue('drive_file_id', '');
    } else {
      form.setValue('download_link', '');
    }

    form.handleSubmit(handleNext)(e);
  }

  function clearProductDraft() {
    clearDraft();
  }

  return (
    <Form {...form}>
      <form onSubmit={beforeNext} className="space-y-6 mb-10">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Name</FormLabel>
              <FormControl>
                <Input {...field} className="md:text-base h-auto px-3 py-1.5 shadow-none" />
              </FormControl>
              <FormDescription>Enter the product name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full shadow-none text-base h-auto! px-3 py-1.5 min-h-9.5">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                      className="text-base"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the most relevant category for this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="owner_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Owner</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full shadow-none text-base h-auto! px-3 py-1.5 min-h-9.5">
                    <SelectValue placeholder="Select an owner" suppressHydrationWarning />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {owners.map(owner => (
                    <SelectItem
                      key={owner.id}
                      className="text-base"
                      value={owner.id.toString()}
                    >
                      {owner.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the owner of this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="license_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">License</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full shadow-none text-base h-auto! px-3 py-1.5 min-h-9.5">
                    <SelectValue placeholder="Select a license" suppressHydrationWarning />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {licenses.map(license => (
                    <SelectItem
                      key={license.id}
                      className="text-base"
                      value={license.id.toString()}
                    >
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the license that applies to this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {(mode === 'edit' && basic.price_type === PriceType.PAID) ? (
          <FormItem>
            <FormLabel className="text-base">Price Type</FormLabel>
            <p className="capitalize">{basic.price_type}</p>
            <FormDescription>This is a paid product. Price type cannot be changed.</FormDescription>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name="price_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Price Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

        <MainFileFields form={form} applicationCategoryId={applicationCategoryId} />

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Version</FormLabel>
              <FormControl>
                <Input
                  className="md:text-base h-auto px-3 py-1.5 shadow-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Enter the product version. If the category is “Application”, use the simplified semantic version format <code>X.Y.Z</code> (e.g. 1.0.0). Otherwise, you may enter any version format.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
          <Link
            href="/product"
            onNavigate={clearProductDraft}
          >
            <ArrowLeft className="icon" /> Back
          </Link>
        </Button>

        <Button
          type="submit"
          className={`h-auto text-base px-3 py-1.5 border border-primary inline-block`}
        >
          Next <ArrowRight className="icon" />
        </Button>
      </form>
    </Form>
  );
}
