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
import { Minus } from 'lucide-react';
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-10">
        {(mode === 'create' || form.getValues('is_banned')) ? (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Email</FormLabel>
                <FormControl>
                  <Input type="email" disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter a valid email address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormItem>
            <FormLabel className="text-base">Email</FormLabel>
            <p>{form.getValues('email')}</p>
            <FormDescription>To prevent account misuse, email can only be updated once the user has been banned. This is typically used during account recovery.</FormDescription>
          </FormItem>
        )}
        
        <div className="flex gap-3 items-start">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">First Name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">Last Name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {mode === 'edit' ? (
          <FormItem>
            <FormLabel className="text-base">Phone Number</FormLabel>
            <p className="tabular-nums">{form.getValues('phone_number') ?? <Minus className="icon text-zinc-300 dark:text-zinc-700" />}</p>
            {!form.getValues('phone_number') && (
              <FormDescription>This information can only be provided by the customer.</FormDescription>
            )}
          </FormItem>
        ) : null}

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-base">Profile Picture</FormLabel>
              <div className="rounded-md border size-40 bg-zinc-100 dark:bg-zinc-900/50">
                <img
                  src={field.value === '' ? '/not-found-image.svg' : field.value}
                  alt="Picture"
                  className={`w-full h-full rounded-md ${field.value === '' ? 'opacity-30 dark:opacity-100' : ''}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <FormControl>
                <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
              </FormControl>
              <FormDescription>Enter the URL of the picture.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
          <Link href="/customer"><ArrowLeft className="icon" /> Back</Link>
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
