'use client';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { generatePassword } from '@/lib/utils';

export default function PasswordInput({
  field,
  description,
  disabled = false,
}) {
  return (
    <FormItem>
      <FormLabel className="text-base">File Access Password</FormLabel>
      <div className="flex w-full items-center">
        <FormControl>
          <Input
            disabled={disabled}
            className="md:text-base h-auto px-3 py-1.5 -me-[1px] shadow-none rounded-e-none z-3 relativ"
            {...field}
          />
        </FormControl>
        <Button
          variant="secondary"
          type="button"
          onClick={() => field.onChange(generatePassword())}
          className={'h-auto text-base px-3 py-1.5 border rounded-s-none'}
          disabled={disabled}
        >
          Generate
        </Button>
      </div>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}
