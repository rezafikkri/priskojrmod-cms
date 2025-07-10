'use client';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '../ui/form';
import { Badge } from '@/components/ui/badge';
import { Input } from '../ui/input';

export default function TitleInput({
  field,
  formState,
  activeLang,
}) {
  const { errors, isSubmitting } = formState;

  return (
    <FormItem>
      <FormLabel className="text-base">
        Title
        <Badge variant="secondary">{activeLang.toUpperCase()}</Badge>
      </FormLabel> 
      <FormControl>
        <Input
          disabled={isSubmitting}
          className="shadow-none md:text-base h-auto px-3 py-1.5 dark:bg-transparent"
          {...field}
        />
      </FormControl>
      <FormDescription>Enter the title.</FormDescription>
      {(errors.title && errors.title[activeLang]) && (
        <p className="text-destructive text-sm">
          {errors.title[activeLang].message}
        </p>
      )}
    </FormItem>
  );
}
