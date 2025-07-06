'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Form,
} from '../ui/form';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Separator } from '../ui/separator';
import ImageFields from './image-fields';
import { createProductExtrasSchema, editProductExtrasSchema } from '@/lib/validators/product-validator';
import { useCreateProductStore } from '@/lib/providers/create-product-store-provider';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import VariantFields from './variant-fields';
import ImageGrid from './image-grid';
import useEditPendingTracker from '@/hooks/use-edit-pending-tracker';

export default function ExtrasForm({
  onNextStep,
  onPrevStep,
  mode = 'create',
}) {
  let extras;
  let setExtras;
  let extrasSchema;

  // for edit mode only
  let basic;

  if (mode === 'create') {
    extras = useCreateProductStore(state => state.extras);
    setExtras = useCreateProductStore(state => state.setExtras);
    extrasSchema = createProductExtrasSchema;
  } else {
    extras = useProductFormStore(state => state.extras);
    setExtras = useProductFormStore(state => state.setExtras);
    extrasSchema = editProductExtrasSchema;
    basic = useProductFormStore(state => state.basic);
  }
  const form = useForm({
    resolver: zodResolver(extrasSchema),
    defaultValues: extras,
  });
  const errors = form.formState.errors;
  const {
    fields: variants,
    remove: removeVariant,
    append: appendVariant,
  } = useFieldArray({
    control: form.control,
    name: 'variants',
  });
  const {
    fields: images,
    remove: removeImage,
    append: appendImage,
    update: updateImage,
  } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const {
    incrementPending,
    decrementPending,
    isBlocking,
  } = useEditPendingTracker();

  function handleNext(data) {
    setExtras(data);
    onNextStep();
  }

  function handlePrev() {
    const data = form.getValues();
    setExtras(data);
    onPrevStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6 lg:max-w-2/3 mb-10">
        <section className="space-y-6 mb-9">
          <h3 className="text-lg font-bold mb-0">Variants</h3>
          <h4 className="text-zinc-700 dark:text-zinc-300/80">List available variants that represent different options for this product.</h4>

          <VariantFields
            form={form}
            variants={variants}
            basic={basic}
            handlers={{
              onAppend: appendVariant,
              onRemove: removeVariant,
              onIncrementPending: incrementPending,
              onDecrementPending: decrementPending,
            }}
          />
        </section>
        <Separator />
        <section className="space-y-6 mb-9">
          <h3 className="text-lg font-bold mb-0">Images</h3>
          <h4 className="text-zinc-700 dark:text-zinc-300/80 mb-0">
            A collection of image URLs that illustrate different aspects of the product.
          </h4>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Make sure all product images have the same dimensions (width and height).
          </p>
          
          <ImageGrid
            form={form}
            images={images}
            basic={basic}
            handlers={{
              onRemove: removeImage,
              onUpdate: updateImage,
              onIncrementPending: incrementPending,
              onDecrementPending: decrementPending,
            }}
          />
          <ImageFields images={images} onAppend={appendImage} />

          {errors?.images && (
            <p className="dark:text-red-500/85 text-destructive text-sm">
              {errors.images.message}
            </p>
          )}
        </section>

        <Button
          variant="outline"
          className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5"
          onClick={handlePrev}
          disabled={isBlocking}
        >
          <ArrowLeft className="icon" /> Previous
        </Button>

        <Button
          type="submit"
          className={`h-auto text-base px-3 py-1.5 border border-primary inline-block`}
          disabled={isBlocking}
        >
          Next <ArrowRight className="icon" />
        </Button>
      </form>
    </Form>
  );
}
