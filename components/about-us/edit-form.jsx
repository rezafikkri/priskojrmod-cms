'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import FormLanguageToggle from '../ui/form-language-toggle';
import ContentInput from '../ui/content-input';
import { aboutUsSchema } from '@/lib/validators/about-us-validator';
import { addAboutUs, editAboutUs } from '@/actions/about-us-actions';
import { toast } from 'sonner';
import { Language } from '@/constants/enums';
import { cmsConfig } from '@/config/cms';
import PhoneNumberFields from '../ui/phone-number-fields';
import { Badge } from '@/components/ui/badge';

function OfficeHoursInput({ activeLang, field, isSubmitting }) {
  return (
    <FormItem className="flex-1">
      <FormLabel className="text-base">
        Office hours
        <Badge variant="secondary">{activeLang.toUpperCase()}</Badge>
      </FormLabel>
      <FormControl>
        <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
      </FormControl>
      <FormDescription>Enter the operational hours (e.g., Mon-Fri 9:00-17:00)</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

export default function EditForm({ aboutUs }) {
  const [hasAboutUs, setHasAboutUs] = useState(aboutUs !== null);
  // generate form default values
  let defaultValues = {
    support_email: '',
    support_whatsapp: {
      country_iso: '',
      number: '',
    },
    office_hours: {
      id: '',
      en: '',
    },
    content: {
      id: '',
      en: '',
    },
  };
  if (aboutUs) {
    defaultValues = {
      id: aboutUs.id,
      support_email: aboutUs.support_email,
      support_whatsapp: aboutUs.support_whatsapp,
      translationId: {
        id: aboutUs.translations.id.id,
        en: aboutUs.translations.id.en,
      },
      office_hours: {
        id: aboutUs.translations.office_hours.id,
        en: aboutUs.translations.office_hours.en,
      },
      content: {
        id: aboutUs.translations.content.id,
        en: aboutUs.translations.content.en,
      },
    };
  }

  const form = useForm({
    resolver: zodResolver(aboutUsSchema),
    defaultValues,
  });

  const [activeLang, setActiveLang] = useState(cmsConfig.defaults.language);
  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(data) {
    const saveRes = hasAboutUs
      ? await editAboutUs(data)
      : await addAboutUs(data);

    if (saveRes.status === 'success') {
      let successMessage;
      if (hasAboutUs) {
        successMessage = 'About us updated successfully';
      } else {
        successMessage = 'About us created successfully';

        // set id to form
        form.register('id');
        form.register('translationId.id');
        form.register('translationId.en');
        form.setValue('id', saveRes.data.id);
        form.setValue('translationId.id', saveRes.data.translations.id.id);
        form.setValue('translationId.en', saveRes.data.translations.id.en);
        
        setHasAboutUs(true);
      }

      toast.success(successMessage);
    } else {
      toast.error(saveRes.message, {
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  return (
    <>
      <FormLanguageToggle activeLang={activeLang} onToggle={setActiveLang} errors={errors} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormField
            control={form.control}
            name="support_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Support Email</FormLabel>
                <FormControl>
                  <Input type="email" disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter a valid email address</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />         

          <PhoneNumberFields
            form={form}
            name="support_whatsapp"
            label="Support WhatsApp"
            description="Enter a reachable WhatsApp phone number"
          />

          {activeLang === Language.ID && (
            <>
              <FormField
                control={form.control}
                name={`office_hours.${Language.ID}`}
                render={({ field }) =>
                  <OfficeHoursInput
                    field={field}
                    activeLang={activeLang}
                    isSubmitting={isSubmitting}
                  />
                }
              />
              <FormField
                control={form.control}
                name={`content.${Language.ID}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.ID}
                    description="Enter detailed information about the business"
                  />
                )}
              />
            </>
          )}
          {activeLang === Language.EN && (
            <>
              <FormField
                control={form.control}
                name={`office_hours.${Language.EN}`}
                render={({ field }) =>
                  <OfficeHoursInput
                    field={field}
                    activeLang={activeLang}
                    isSubmitting={isSubmitting}
                  />
                }
              />
              <FormField
                control={form.control}
                name={`content.${Language.EN}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.EN}
                    description="Enter detailed information about the business"
                  />
                )}
              />
            </>
          )}

          <div className="relative inline-flex">
            <Button
              type="submit"
              className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>
                {hasAboutUs ? 'Update' : 'Create'}
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
