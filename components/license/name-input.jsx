'use client';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '../ui/form';
import { Badge } from '@/components/ui/badge';
import { Input } from '../ui/input';

export default function NameInput({
  field,
  formState,
  activeLang,
}) {
  const { errors, isSubmitting } = formState;

  return (
    <FormItem>
      <FormLabel className="text-base">
        Name
        <Badge variant="secondary">{activeLang.toUpperCase()}</Badge>
      </FormLabel> 
      <FormControl>
        <Input
          disabled={isSubmitting}
          className="shadow-none md:text-base h-auto px-3 py-1.5 dark:bg-transparent"
          {...field}
        />
      </FormControl>
      <FormDescription>Enter the license name (e.g., Free License, Personal License, Pro App License).</FormDescription>
      {(errors.name && errors.name[activeLang]) && (
        <p className="text-destructive text-sm">
          {errors.name[activeLang].message}
        </p>
      )}
    </FormItem>
  );
}
