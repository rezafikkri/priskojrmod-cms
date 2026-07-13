'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import parsePhoneNumber from 'libphonenumber-js';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

const countryIsoOptions = [
  // Southeast and South Asia
  { label: 'Indonesia (+62)', value: 'ID' },
  { label: 'Singapore (+65)', value: 'SG' },
  { label: 'Malaysia (+60)', value: 'MY' },
  { label: 'Philippines (+63)', value: 'PH' },
  { label: 'Thailand (+66)', value: 'TH' },
  { label: 'Vietnam (+84)', value: 'VN' },
  { label: 'India (+91)', value: 'IN' },
  { label: 'Bangladesh (+880)', value: 'BD' },
  { label: 'Pakistan (+92)', value: 'PK' },

  // East Asia
  { label: 'Japan (+81)', value: 'JP' },
  { label: 'South Korea (+82)', value: 'KR' },
  { label: 'Hong Kong (+852)', value: 'HK' },
  { label: 'Taiwan (+886)', value: 'TW' },

  // Middle East
  { label: 'United Arab Emirates (+971)', value: 'AE' },
  { label: 'Saudi Arabia (+966)', value: 'SA' },
  { label: 'Qatar (+974)', value: 'QA' },
  { label: 'Turkey (+90)', value: 'TR' },
  { label: 'Egypt (+20)', value: 'EG' },

  // Africa
  { label: 'Nigeria (+234)', value: 'NG' },
  { label: 'Kenya (+254)', value: 'KE' },

  // Western & Eastern Europe
  { label: 'United Kingdom (+44)', value: 'GB' },
  { label: 'Germany (+49)', value: 'DE' },
  { label: 'Netherlands (+31)', value: 'NL' },
  { label: 'France (+33)', value: 'FR' },
  { label: 'Poland (+48)', value: 'PL' },
  { label: 'Romania (+40)', value: 'RO' },

  // North & South America
  { label: 'United States (+1)', value: 'US' },
  { label: 'Canada (+1)', value: 'CA' },
  { label: 'Mexico (+52)', value: 'MX' },
  { label: 'Brazil (+55)', value: 'BR' },
  { label: 'Argentina (+54)', value: 'AR' },
  { label: 'Colombia (+57)', value: 'CO' },
  { label: 'Chile (+56)', value: 'CL' },
  { label: 'Peru (+51)', value: 'PE' },

  // Oseania
  { label: 'Australia (+61)', value: 'AU' },
  { label: 'New Zealand (+64)', value: 'NZ' },

  // Fallback
  { label: 'Other', value: 'OTHER' },
];

const countryIsoMap = new Map(countryIsoOptions.map(country => [country.value, country]));

export default function PhoneNumberFields({
  form,
  name,
  label,
  description,
}) {
  const isSubmitting = form.formState.isSubmitting;
  const phoneNumberErrors = form.formState.errors[name];

  const countryIso = useWatch({ name: `${name}.countryIso` });
  const number = useWatch({ name: `${name}.number` });
  const parsedNumber = parsePhoneNumber(
    number,
    countryIso === 'OTHER' ? undefined : countryIso,
    { extract: false },
  );
  
  let numberInputPlaceholder = '';
  if (countryIso === 'OTHER') {
    numberInputPlaceholder = 'International phone number (+ country code)';
  }

  useEffect(() => {
    if (!number.startsWith('+')) return;

    const timeoutId = setTimeout(() => {
      // detect country iso from number
      const detectedCountry = parsePhoneNumber(number, { extract: false })?.country;
      if (!detectedCountry) return;

      const newCountryIso = countryIsoMap.has(detectedCountry) ? detectedCountry : 'OTHER';

      form.setValue(`${name}.countryIso`, newCountryIso, {
        shouldValidate: true,
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [number]);

  function handleCountryIsoChange(countryIso, fieldOnChange) {
    fieldOnChange(countryIso);

    if (form.formState.isSubmitted) {
      form.trigger(`${name}.number`);
    }
  }

  return (
    <div className="space-y-2">
      <FormLabel className="text-base" data-error={!!phoneNumberErrors}>{label}</FormLabel>

      <p className="text-sm text-zinc-500">
        Preview: {parsedNumber ? parsedNumber.formatInternational() : '-'}
      </p>

      <div className="flex">
        <FormField
          control={form.control}
          name={`${name}.countryIso`}
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(value) => handleCountryIsoChange(value, field.onChange)}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger
                    className="shadow-none text-base h-auto! px-3 py-1.5 min-h-9.5 min-w-50 flex-none rounded-e-none relative aria-invalid:z-2 data-[state=open]:z-2"
                  >
                    <SelectValue placeholder="Select a country"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countryIsoOptions.map(countryIso => (
                    <SelectItem
                      key={countryIso.value}
                      value={countryIso.value}
                      className="text-base"
                    >
                      {countryIso.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${name}.number`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  disabled={isSubmitting}
                  {...field}
                  className="shadow-none md:text-base h-auto px-3 py-1.5 rounded-s-none relative -ms-[1px] focus-visible:z-3" 
                  type="tel"
                  placeholder={numberInputPlaceholder}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormDescription>{description}</FormDescription>
      {phoneNumberErrors?.countryIso && (
        <p className="dark:text-red-500/85 text-destructive text-sm">
          {phoneNumberErrors.countryIso.message}
        </p>
      )}
      {phoneNumberErrors?.number && (
        <p className="dark:text-red-500/85 text-destructive text-sm">
          {phoneNumberErrors.number.message}
        </p>
      )}
    </div>
  );
}
