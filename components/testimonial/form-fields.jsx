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
import { useState } from 'react';
import { Language } from '@/constants/enums';
import ContentInput from '../ui/content-input';
import FormImagePreview from '../ui/form-image-preview';
import { cmsConfig } from '@/config/cms';

export default function FormFields({
  mode,
  form,
  onSubmit,
  isResetEditor,
}) {
  const { isSubmitting } = form.formState;
  const [activeLang, setActiveLang] = useState(cmsConfig.defaults.language);

  return (
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
              <FormDescription>Enter the customer's name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="smProfileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Social media profile URL</FormLabel>
              <FormControl>
                <Input disabled={isSubmitting} {...field} className="md:text-base h-auto px-3 py-1.5 shadow-none" />
              </FormControl>
              <FormDescription>Enter the URL of your primary social media profile (X, Instagram, YouTube, Facebook, LinkedIn or GitHub only).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-base">Profile picture</FormLabel>
              <FormImagePreview src={field.value} />
              <FormControl>
                <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
              </FormControl>
              <FormDescription>Enter the URL of the picture</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {activeLang === Language.ID && (
          <FormField
            control={form.control}
            name={`message.${Language.ID}`}
            render={({ field }) => (
              <ContentInput
                field={field}
                activeLang={activeLang}
                onActivelangChange={setActiveLang}
                {...(isResetEditor && { isResetEditor })}
                description="Enter the original message provided by the customer without modification. Translate it into the other language without altering its meaning."
                label='Message'
                disabled={isSubmitting}
              />
            )}
          />
        )}
        {activeLang === Language.EN && (
          <FormField
            control={form.control}
            name={`message.${Language.EN}`}
            render={({ field }) => (
              <ContentInput
                field={field}
                activeLang={activeLang}
                onActivelangChange={setActiveLang}
                {...(isResetEditor && { isResetEditor })}
                description="Enter the original message provided by the customer without modification. Translate it into the other language without altering its meaning."
                label='Message'
                disabled={isSubmitting}
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
  );
}
