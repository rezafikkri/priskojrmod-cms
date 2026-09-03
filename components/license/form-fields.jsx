'use client';

import {
  Form,
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '../ui/form';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import ContentInput from '../ui/content-input';
import { Language } from '@/constants/enums';
import { cmsConfig } from '@/config/cms';
import { Input } from '../ui/input';
import { getLangErrorInfo } from '@/lib/utils';
import FormLanguageSelect from '../ui/form-language-select';
import { FormErrorMessage } from '../ui/form-error-message';

function NameInput({
  field,
  activeLang,
  onActivelangChange,
  errors,
  disabled = false,
}) {
  const {
    error,
    isInactiveLangError,
    inactiveLangErrorMessage,
  } = getLangErrorInfo({ activeLang, fieldName: field.name, errors });

  return (
    <FormItem>
      <FormLabel className="text-base justify-between">
        Name
        <FormLanguageSelect
          activeLang={activeLang}
          onSelect={onActivelangChange}
        />
      </FormLabel> 
      <FormControl>
        <Input
          disabled={disabled}
          className="shadow-none md:text-base h-auto px-3 py-1.5 dark:bg-transparent"
          {...field}
        />
      </FormControl>
      <FormDescription>Enter the license name (e.g., Free License, Personal License, Pro App License)</FormDescription>
      {error && (
        <FormErrorMessage>
          {isInactiveLangError
            ? inactiveLangErrorMessage
            : error[activeLang].message}
        </FormErrorMessage>
      )}
    </FormItem>
  );
}

export default function FormFields({
  mode,
  form,
  onSubmit,
  isResetEditor,
}) {
  const [activeLang, setActiveLang] = useState(cmsConfig.defaults.language);
  const { isSubmitting, errors } = form.formState;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-10">
        {activeLang === Language.ID && (
          <>
            <FormField
              control={form.control}
              name={`name.${Language.ID}`}
              render={({ field }) => (
                <NameInput
                  field={field}
                  activeLang={activeLang}
                  onActivelangChange={setActiveLang}
                  errors={errors}
                  disabled={isSubmitting}
                />
              )}
            />
            <FormField
              control={form.control}
              name={`content.${Language.ID}`}
              render={({ field }) => (
                <ContentInput
                  field={field}
                  activeLang={activeLang}
                  onActivelangChange={setActiveLang}
                  {...(isResetEditor && { isResetEditor })}
                  description="Enter license content"
                  disabled={isSubmitting}
                />
              )}
            />
          </>
        )}
        {activeLang === Language.EN && (
          <>
            <FormField
              control={form.control}
              name={`name.${Language.EN}`}
              render={({ field }) => (
                <NameInput
                  field={field}
                  activeLang={activeLang}
                  onActivelangChange={setActiveLang}
                  errors={errors}
                  disabled={isSubmitting}
                />
              )}
            />
            <FormField
              control={form.control}
              name={`content.${Language.EN}`}
              render={({ field }) => (
                <ContentInput
                  field={field}
                  activeLang={activeLang}
                  onActivelangChange={setActiveLang}
                  {...(isResetEditor && { isResetEditor })}
                  description="Enter license content"
                  disabled={isSubmitting}
                />
              )}
            />
          </>
        )}

        <Button asChild variant="outline" className="me-3 mb-0 h-auto text-base px-3 py-1.5 inline-block">
          <Link href="/license"><ArrowLeft className="icon" /> Back</Link>
        </Button>
        <div className="relative inline-flex">
          <Button
            type="submit"
            className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
            disabled={isSubmitting}
          >
            <span className={isSubmitting ? 'opacity-0' : ''}>
              {mode === 'edit' ? 'Update' : 'Create'}
            </span>
          </Button>
          {isSubmitting && 
            <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary-foreground" size={16} />
            </div>
          }
        </div>
      </form>
    </Form>
  );
}
