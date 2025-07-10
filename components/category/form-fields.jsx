'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FormFields({
  mode,
  form,
  onSubmit,
}) {
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Name</FormLabel>
              <FormControl>
                <Input disabled={isSubmitting} {...field} className="md:text-base h-auto px-3 py-1.5 shadow-none" />
              </FormControl>
              <FormDescription>Enter the category name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
          <Link href="/category"><ArrowLeft className="icon" /> Back</Link>
        </Button>
        <div className="relative inline-block">
          <Button
            type="submit"
            className={`h-auto text-base px-3 py-1.5 disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} border border-primary`}
            disabled={isSubmitting}
          >
            <span className={isSubmitting ? 'opacity-0' : ''}>
              {mode === 'edit' ? 'Update' : 'Create'}
            </span>
          </Button>
          {isSubmitting && (
            <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary-foreground" size={16} />
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
