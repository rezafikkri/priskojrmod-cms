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
import { useState } from 'react';
import FormLanguageToggle from '../ui/form-language-toggle';
import { Language } from '@/constants/enums';
import ContentInput from '../ui/content-input';

export default function FormFields({
  mode,
  form,
  onSubmit,
  isResetEditor,
}) {
  const { isSubmitting, errors } = form.formState;
  const [activeLang, setActiveLang] = useState(Language.ID);

  return (
    <>
      <FormLanguageToggle
        activeLang={activeLang}
        onToggle={setActiveLang}
        errors={errors}
        fieldNames={['message']}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-10">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">Name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter the customer's name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sm_username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Social Media Username</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="md:text-base h-auto px-3 py-1.5 shadow-none" />
                </FormControl>
                <FormDescription>Enter the customer's social media username (Facebook, Instagram, or Twitter only).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {activeLang === Language.ID && (
            <FormField
              control={form.control}
              name={`message.${Language.ID}`}
              render={({ field, formState }) => (
                <ContentInput
                  field={field}
                  formState={formState}
                  activeLang={Language.ID}
                  {...(isResetEditor && { isResetEditor })}
                  description="Enter the original message provided by the customer without modification. Translate it into the other language without altering its meaning."
                  label='Message'
                />
              )}
            />
          )}
          {activeLang === Language.EN && (
            <FormField
              control={form.control}
              name={`message.${Language.EN}`}
              render={({ field, formState }) => (
                <ContentInput
                  field={field}
                  formState={formState}
                  activeLang={Language.EN}
                  {...(isResetEditor && { isResetEditor })}
                  description="Enter the original message provided by the customer without modification. Translate it into the other language without altering its meaning."
                  label='Message'
                />
              )}
            />
          )}

          <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
            <Link href="/testimonial"><ArrowLeft className="icon" /> Back</Link>
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
    </>
  );
}
