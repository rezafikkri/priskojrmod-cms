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
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

export default function DriveFileIDFields({ form }) {
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

  return (
    <FormField
      control={form.control}
      name="drive_file_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">Drive File ID</FormLabel>
          <p className="text-sm text-zinc-700">Name: {fileName ?? '-'}</p>
          <p className="text-sm text-zinc-700 mb-1">Size: {fileSize ?? '-'}</p>
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
          <FormDescription>Enter the Google Drive file ID, then click “Get Info” to confirm the file details.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
