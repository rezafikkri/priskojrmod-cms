'use client';

import { Fragment, useState } from 'react';
import { v4 } from 'uuid';
import { removeProductVariant } from '@/actions/product-actions';
import { toast } from 'sonner';
import {
  Plus,
  Trash,
  Loader2,
} from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { Separator } from '../ui/separator';
import { useQueryClient } from '@tanstack/react-query';
import PasswordInput from './password-input';

export default function VariantFields({
  form,
  variants,
  productId,
  handlers,
}) {
  const {
    onRemove,
    onAppend,
    onIncrementPending,
    onDecrementPending,
  } = handlers;
  const [deletingIds, setDeletingIds] = useState([]);
  const queryClient = useQueryClient();

  function handleAdd() {
    onAppend({
      id: v4(),
      name: '',
      download_link: '',
      file_access_password: '',
    });
  }

  const isDeleting = (id) => deletingIds.includes(id);

  async function handleDelete(dbId, index) {
    if (dbId) {
      // set pending state for disabled prev next button and show loading
      onIncrementPending();
      setDeletingIds([...deletingIds, dbId]);
      const removeRes = await removeProductVariant(dbId, productId);

      if (removeRes.status === 'success') {
        const currentVariants = form.getValues('variants');
        form.setValue('variants', currentVariants.filter(variant => variant.dbId !== dbId));

        if (currentVariants.length <= 1) {
          handleAdd();
        }

        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        toast.error(removeRes.message);
        return;
      }

      // set pending state for enabled prev next button and hide loading
      onDecrementPending();
      setDeletingIds(prev => prev.filter(id => id !== dbId));
    } else {
      onRemove(index);
    }
  }

  return (
    variants.map((variant, index) => (
      <Fragment key={variant.id}>
        <div className="flex gap-5 items-center">
          <div className="flex-1 space-y-6">
            <FormField
              control={form.control}
              name={`variants.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isDeleting(variant.dbId)}
                      className="shadow-none md:text-base h-auto px-3 py-1.5"
                    />
                  </FormControl>
                  <FormDescription>Enter the variant name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`variants.${index}.download_link`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">Download Link</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isDeleting(variant.dbId)}
                      className="shadow-none md:text-base h-auto px-3 py-1.5"
                    />
                  </FormControl>
                  <FormDescription>Optional. Add a download link if this variant includes an extra file.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`variants.${index}.file_access_password`}
              render={({ field }) => (
                <PasswordInput
                  field={field}
                  description='Enter a strong password for the extra file in the download link. Click Generate to create one automatically or use an online password generator.'
                  disabled={isDeleting(variant.dbId)}
                />
              )}
            />
          </div>

          <Separator orientation="vertical" className="h-40!" />

          <div className="flex flex-col gap-3">
            {(variants.length > 1 || variant.dbId) && (
              <div className="relative inline-block">
                <TooltipWrapper text="Delete variant" background="bg-destructive">
                  <Button
                    type="button"
                    variant="secondary"
                    className={`hover:text-destructive dark:hover:text-red-500/90 ${isDeleting(variant.dbId) ? 'disabled:opacity-100' : ''}`}
                    onClick={() => handleDelete(variant.dbId, index)}
                    disabled={isDeleting(variant.dbId)}
                  >
                    <Trash className={`icon ${isDeleting(variant.dbId) ? 'opacity-0' : ''}`} />
                  </Button>
                </TooltipWrapper>               
                {isDeleting(variant.dbId) &&
                  <div
                    className="absolute h-full top-0 left-0 right-0 flex justify-center items-center"
                  >
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                }
              </div>
            )}
            {index === variants.length - 1 && (
              <TooltipWrapper text="Add variant">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAdd}
                >
                  <Plus />
                </Button>
              </TooltipWrapper>
            )}
          </div>
        </div>

        {index !== variants.length - 1 && (
          <div className="pe-15">
            <Separator />
          </div>
        )}
      </Fragment>
    ))
  );
}
