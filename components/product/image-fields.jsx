'use client';

import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { createProductImageSchema } from '@/lib/validators/product-validator';

export default function ImageFields({
  onAppend,
  images,
}) {
  function computeHasThumbnail() {
    return images.some(image => image.is_thumbnail);
  }

  const [hasThumbnail, setHasThumbnail] = useState(computeHasThumbnail);
  const [hasAttemptedAdd, setHasAttemptedAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isThumbnail, setIsThumbnail] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    const computedHasThumbnail = computeHasThumbnail();
    if (computedHasThumbnail !== hasThumbnail) {
      setHasThumbnail(computedHasThumbnail);
    }
  }, [images]);

  function validateImageData(updatedField) {
    const imageResult = createProductImageSchema.safeParse({
      url,
      width,
      height,
      is_thumbnail: isThumbnail,
      ...updatedField,
    });

    if (!imageResult.success) {
      let newErrors = {};
      for (const error of imageResult.error.issues) {
        newErrors[error.path[0]] = error.message;
      }
      setErrors(newErrors);
      return false;
    }
    setErrors(null);
    return true;
  }

  function handleUrlChange(e) {
    if (hasAttemptedAdd) {
      validateImageData({ url: e.target.value });
    }
    setUrl(e.target.value);
  }

  function handleWidthChange(e) {
    if (hasAttemptedAdd) {
      validateImageData({ width: e.target.value });
    }
    setWidth(e.target.value);
  }

  function handleHeightChange(e) {
    if (hasAttemptedAdd) {
      validateImageData({ height: e.target.value });
    }
    setHeight(e.target.value);
  }

  function handleAdd() {
    if (!hasAttemptedAdd) {
      setHasAttemptedAdd(true);
    }

    const isValid = validateImageData();
    if (!isValid) return;

    onAppend({
      url,
      width,
      height,
      is_thumbnail: isThumbnail,
    });
    if (!hasThumbnail && isThumbnail) {
      setHasThumbnail(true);
    } 
    setIsThumbnail(false);
    setUrl('');
  }

  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="url"
          className="text-base dark:data-[error=true]:text-red-500/90 data-[error=true]:text-destructive"
          data-error={!!errors?.url}
        >
          URL
        </Label>
        <Input
          type="text"
          id="url"
          value={url}
          onChange={handleUrlChange}
          className="shadow-none md:text-base h-auto px-3 py-1.5"
          aria-invalid={!!errors?.url}
        />
        <p className="text-muted-foreground text-sm">Enter the image URL.</p>
        {errors?.url && (
          <p className="dark:text-red-500/85 text-destructive text-sm">
            {errors.url}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label
            htmlFor="width"
            className="text-base dark:data-[error=true]:text-red-500/90 data-[error=true]:text-destructive"
            data-error={!!errors?.width}
          >
            Width
          </Label>
          <div className="flex">
            <Input
              type="number"
              id="width"
              value={width}
              onChange={handleWidthChange}
              className="shadow-none md:text-base h-auto px-3 py-1.5 rounded-e-none z-1"
              aria-invalid={!!errors?.width}
            />
            <span className="inline-block md:text-base h-auto px-3 py-1.5 border border-s-0 rounded-e-md bg-zinc-50 dark:bg-zinc-900/50">px</span>
          </div>
          <p className="text-muted-foreground text-sm">Enter the image width.</p>
          {errors?.width && (
            <p className="dark:text-red-500/85 text-destructive text-sm">
              {errors.width}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label
            htmlFor="height"
            className="text-base dark:data-[error=true]:text-red-500/90 data-[error=true]:text-destructive"
            aria-invalid={!!errors?.height}
          >
            Height
          </Label>
          <div className="flex">
            <Input
              type="number"
              id="height"
              value={height}
              onChange={handleHeightChange}
              className="shadow-none md:text-base h-auto px-3 py-1.5 rounded-e-none z-1"
              aria-invalid={!!errors?.height}
            />
            <span className="inline-block md:text-base h-auto px-3 py-1.5 border border-s-0 rounded-e-md bg-zinc-50 dark:bg-zinc-900/50">px</span>
          </div>
          <p className="text-muted-foreground text-sm">Enter the image height.</p>
          {errors?.height && (
            <p className="dark:text-red-500/85 text-destructive text-sm">
              {errors.height}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-start gap-4">
        <Checkbox
          id="is_thumbnail"
          checked={isThumbnail}
          onCheckedChange={() => setIsThumbnail(prev => !prev)}
          disabled={hasThumbnail}
        />
        <div className="space-y-2">
          <Label htmlFor="is_thumbnail" className="text-base leading-none">Use as Thumbnail</Label>
          <p className="text-muted-foreground text-sm">
            Check if this image should be used as the main thumbnail on the product page.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="text-base px-3 py-1.5 h-auto! inline-block"
        onClick={handleAdd}
      >
        <Plus className="icon" /> Add Image
      </Button>
    </>
  );
}
