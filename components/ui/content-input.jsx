import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '../ui/form';
import Editor from '../ui/editor';
import { getNestedValue } from '@/lib/utils';
import FormLanguageSelect from './form-language-select';
import { Language } from '@/constants/enums';
import { useFormState } from 'react-hook-form';

export default function ContentInput({
  field,
  activeLang,
  onActivelangChange,
  isResetEditor,
  description,
  disabled = false,
  label = 'Content',
}) {
  const { errors, isSubmitting } = useFormState();

  const parentFieldName = field.name.slice(0, field.name.lastIndexOf('.'));
  let isOtherSectionError = false;
  let isContentError = false;
  let error;
  if (errors && Object.keys(errors).length) {
    error = getNestedValue(errors, parentFieldName);

    // This logic is highly dependent on the format of
    // the translations object in mapTranslationsToObject
    if (error && !error[activeLang]) {
      isOtherSectionError = true;
    } else if (error) {
      isContentError = true;
    }
  }

  return (
    <FormItem>
      <FormLabel className="text-base justify-between">
        <span>{label}</span>
        <FormLanguageSelect
          activeLang={activeLang}
          onSelect={onActivelangChange}
          isOtherSectionError={isOtherSectionError}
        />
      </FormLabel>
      <FormControl>
        <Editor
          {...field}
          isError={isContentError}
          disabled={disabled || isSubmitting}
          isResetEditor={isResetEditor}
        />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      {error && (
        <p className="text-destructive dark:text-red-500/85 text-sm">
          {isOtherSectionError
            ? `There are errors in the ${activeLang === Language.ID ? 'English' : 'Indonesian'} section`
            : error[activeLang].message}
        </p>
      )}
    </FormItem>
  );
}
