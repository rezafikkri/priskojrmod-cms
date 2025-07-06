'use client';

import { removeProductImage } from '@/actions/product-actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash, Image } from 'lucide-react';
import { Button } from '../ui/button';
import TooltipWrapper from '../ui/tooltip-wrapper';

export default function ImageGrid({
  form,
  images,
  basic,
  handlers,
}) {
  const {
    onRemove,
    onUpdate,
    onIncrementPending,
    onDecrementPending,
  } = handlers;
  const [deletingIds, setDeletingIds] = useState([]);

  const isDeleting = (id) => deletingIds.includes(id);

  function handleSetAsThumbnail({ index, image }) {
    for (const [currentIndex, image] of images.entries()) {
      if (image.is_thumbnail) {
        onUpdate(currentIndex, {
          ...image,
          is_thumbnail: false,
        });
        break;
      }
    }
    onUpdate(index, {
      ...image,
      is_thumbnail: true,
    });
  }

  async function handleDelete(dbId, index) {
    if(dbId) {
      // set pending state for disabled prev next button and show loading
      onIncrementPending();
      setDeletingIds([...deletingIds, dbId]);
      const removeRes = await removeProductImage(dbId, basic.id);

      if (removeRes.status === 'success') {
        const currentImages = form.getValues('images');
        form.setValue('images', currentImages.filter(image => image.dbId !== dbId));
      } else {
        toast.error(removeRes.message);
      }
      // set pending state for enabled prev next button and hide loading
      onDecrementPending();
      setDeletingIds(prev => prev.filter(id => id !== dbId));
    } else {
      onRemove(index);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      {images.length <= 0 ? (
        <div className="rounded-md border bg-gray-100 dark:bg-zinc-900/50 overflow-hidden relative">
          <img src="/not-found-image.svg" alt="Not found" className="opacity-30 dark:opacity-100" />
        </div>
      ) : images.map((image, index) => (
        <div className="relative" key={image.id}>
          {isDeleting(image.dbId) && (
            <div
              className="absolute bottom-0 top-0 left-0 right-0 flex justify-center items-center z-2 bg-background/60"
            >
              <Loader2 className="animate-spin" size={16} />
            </div>
          )}
          <div
            className={`rounded-md border bg-gray-100 dark:bg-zinc-900/50 overflow-hidden relative group ${image.is_thumbnail ? 'border-green-500 dark:border-green-600 border-2' : ''}`}
          >
            <div className="absolute right-2 top-2 space-x-2 items-center invisible opacity-0 group-hover:visible group-hover:opacity-100 animate-in fade-in duration-200 z-1">
              {!image.is_thumbnail && (
                <TooltipWrapper text="Set as thumbnail">
                  <Button
                    variant="outline"
                    type="button"
                    className="p-1! h-auto border-0 rounded-full dark:hover:bg-input"
                    onClick={() => handleSetAsThumbnail({ index, image })}
                  >
                    <Image className="icon size-4" />
                  </Button>
                </TooltipWrapper>
              )}
              <TooltipWrapper text="Delete" background="bg-destructive">
                <Button
                  onClick={() => handleDelete(image.dbId, index)}
                  variant="outline"
                  type="button"
                  className="p-1! h-auto border-0 rounded-full hover:text-destructive dark:hover:text-red-500/90 dark:hover:bg-zinc-800/95"
                >
                  <Trash className="icon size-4" />
                </Button>
              </TooltipWrapper>
            </div>
            <img
              src={image.url}
              alt="Images"
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
              width={image.width}
              height={image.height}
            />
            {image.is_thumbnail && (
              <span
                className="absolute bottom-2 left-2 text-xs bg-zinc-100 dark:bg-zinc-900 rounded-sm py-0.5 px-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 animate-in fade-in duration-200"
              >
                Thumbnail
              </span>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}
