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
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import VariantFields from './variant-fields';
import ImageGrid from './image-grid';
import useEditPendingTracker from '@/hooks/use-edit-pending-tracker';
import { PriceType } from '@/constants/enums';
import { editProduct } from '@/actions/product-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';

export default function ExtrasForm({
  onNextStep,
  onPrevStep,
  mode = 'create',
}) {
  const queryClient = useQueryClient();

  const extras = useProductFormStore(state => state.form.extras);
  const setExtras = useProductFormStore(state => state.setExtras);
  let extrasSchema;

  // for create mode only
  let productId;

  // for edit mode only
  let basic;
  let setBasic;
  let content;
  let setContent;
  let setVersionStatus;
  let setReference;

  if (mode === 'create') {
    extrasSchema = createProductExtrasSchema;
    productId = useProductFormStore(state => state.form.basic.id);
  } else {
    extrasSchema = editProductExtrasSchema;
    basic = useProductFormStore(state => state.form.basic);
    setBasic = useProductFormStore(state => state.setBasic);
    content = useProductFormStore(state => state.form.content);
    setContent = useProductFormStore(state => state.setContent);
    setVersionStatus = useProductFormStore(state => state.setVersionStatus);
    setReference = useProductFormStore(state => state.setReference);
  }

  const form = useForm({
    resolver: zodResolver(extrasSchema),
    defaultValues: extras,
  });
  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;
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
    data.variants = data.variants.map(variant => ({
      ...variant,
      ...(!variant.downloadUrl ? { fileAccessPassword: '' } : {}),
    }));

    setExtras(data);
    onNextStep();
  }

  async function handleSubmit(data) {
    let product = {
      ...basic,
      ...content,
      ...data,
    };

    product.variants = data.variants.map(variant => {
      let newVariant = { ...variant };

      if (!newVariant.downloadUrl) newVariant.fileAccessPassword = '';

      delete newVariant.id;
      return newVariant;
    });

    const saveRes = await callAction(() => editProduct(product));

    if (saveRes.status === 'success') {
      // reset versionStatus state and update reference (dbVersion, dsb)
      setVersionStatus('pristine');
      setReference({
        dbPriceType: basic.priceType,
        dbVersion: basic.version,
        dbChangelog: content.changelog,
      });

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

      form.reset(saveRes.data.extras);
      toast.success('Product updated successfully.');

      queryClient.invalidateQueries({ queryKey: ['products'] });
    } else {
      toast.error(saveRes.message, {
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  async function handleProceed(data) {
    if (mode == 'edit' && basic.priceType === PriceType.FREE) {
      await handleSubmit(data);
    } else {
      handleNext(data);
    }
  }

  function handlePrev() {
    const data = form.getValues();

    data.variants = data.variants.map(variant => ({
      ...variant,
      ...(!variant.downloadUrl ? { fileAccessPassword: '' } : {}),
    }));

    setExtras(data);
    onPrevStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleProceed)} className="space-y-6 mb-10">
        <section className="space-y-6 mb-9">
          <h3 className="text-lg font-bold mb-0">Variants</h3>
          <h4 className="text-zinc-700 dark:text-zinc-300/80">List available variants that represent different options for this product.</h4>

          <VariantFields
            form={form}
            variants={variants}
            productId={productId ?? basic?.id}
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
            productId={productId ?? basic?.id}
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

        {(mode === 'edit' && basic.priceType === PriceType.FREE) ? (
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
        ) : (
          <Button
            type="submit"
            className={`h-auto text-base px-3 py-1.5 border border-primary inline-block`}
            disabled={isBlocking}
          >
            Next <ArrowRight className="icon" />
          </Button>
        )}
      </form>
    </Form>
  );
}
