'use client';

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
import { Loader2 } from 'lucide-react';
import { fetchDriveFileInfo } from '@/actions/product-actions';
import { useState } from 'react';
import { formatFileSize } from '@/lib/format-file-size';
import { toast } from 'sonner';
import { useWatch } from 'react-hook-form';
import { PriceType } from '@/constants/enums';

export default function MainFileFields({ form, applicationCategoryId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(null);

  async function handleGetFileInfo() {
    setIsLoading(true);

    const fileInfo = await fetchDriveFileInfo(form.getValues('drive_file_id'));

    if (fileInfo.status === 'success') {
      setFileName(fileInfo.data.name);
      setFileSize(formatFileSize(parseInt(fileInfo.data.size)));
    } else {
      setFileName(null);
      setFileSize(null);
      toast.error(fileInfo.message);
    }

    setIsLoading(false);
  }

  const categoryId = useWatch({ control: form.control, name: 'category_id' });
  const priceType = useWatch({ control: form.control, name: 'price_type' });

  return (
    <>
      {(priceType === PriceType.FREE || categoryId === applicationCategoryId.toString()) ? (
        <FormField
          key="download_link"
          control={form.control}
          name="download_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Download Link</FormLabel>
              <FormControl>
                <Input
                  className="md:text-base h-auto px-3 py-1.5 shadow-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Enter a direct download link for the product's main file. Make sure the link always points to the latest version.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          key="drive_file_id"
          control={form.control}
          name="drive_file_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Drive File ID</FormLabel>
              <p className="text-sm text-zinc-500">Name: {fileName ?? '-'}</p>
              <p className="text-sm text-zinc-500 mb-1">Size: {fileSize ?? '-'}</p>
              <div className="flex w-full items-center">
                <FormControl>
                  <Input
                    className="md:text-base h-auto px-3 py-1.5 -me-[1px] shadow-none rounded-e-none z-3 relativ"
                    {...field}
                  />
                </FormControl>
                <div className="relative">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleGetFileInfo}
                    className={`h-auto text-base px-3 py-1.5 border rounded-s-none ${isLoading ? 'disabled:opacity-100 transition-none' : ''}`}
                    disabled={isLoading}
                  >
                    <span className={isLoading ? 'opacity-0' : ''}>Get Info</span>
                  </Button>
                  {isLoading && (
                    <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                      <Loader2 className="animate-spin" size={16} />
                    </div>
                  )}
                </div>
              </div>
              <FormDescription>Enter the Google Drive file ID for the product’s main file, then click “Get Info” to confirm the file details. Leave empty if shared manually. Ensure the file ID refers to the latest version.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
