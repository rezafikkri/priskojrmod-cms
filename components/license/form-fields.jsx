'use client';

import {
  Form,
  FormField,
} from '../ui/form';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import FormLanguageToggle from '../ui/form-language-toggle';
import ContentInput from '../ui/content-input';
import { Language } from '@/constants/enums';
import NameInput from './name-input';

export default function FormFields({
  mode,
  form,
  onSubmit,
  isResetEditor,
}) {
  const [activeLang, setActiveLang] = useState(Language.ID);
  const { isSubmitting, errors } = form.formState;
  
  return (
    <>
      <FormLanguageToggle activeLang={activeLang} onToggle={setActiveLang} errors={errors} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
          {activeLang === Language.ID && (
            <>
              <FormField
                control={form.control}
                name={`name.${Language.ID}`}
                render={({ field, formState }) => (
                  <NameInput field={field} formState={formState} activeLang={Language.ID} />
                )}
              />
              <FormField
                control={form.control}
                name={`content.${Language.ID}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.ID}
                    {...(isResetEditor && { isResetEditor })}
                    description="Enter license content."
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
                render={({ field, formState }) => (
                  <NameInput field={field} formState={formState} activeLang={Language.EN} />
                )}
              />
              <FormField
                control={form.control}
                name={`content.${Language.EN}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.EN}
                    {...(isResetEditor && { isResetEditor })}
                    description="Enter license content."
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
    </>
  );
}
