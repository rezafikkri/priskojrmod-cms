import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '../ui/form';
import Editor from '../ui/editor';
import { getLangErrorInfo } from '@/lib/utils';
import FormLanguageSelect from './form-language-select';
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

  const {
    error,
    isInactiveLangError,
    isActiveLangError,
    inactiveLangErrorMessage,
  } = getLangErrorInfo({ activeLang, fieldName: field.name, errors });

  return (
    <FormItem>
      <FormLabel className="text-base justify-between">
        <span>{label}</span>
        <FormLanguageSelect
          activeLang={activeLang}
          onSelect={onActivelangChange}
        />
      </FormLabel>
      <FormControl>
        <Editor
          {...field}
          isError={isActiveLangError}
          disabled={disabled || isSubmitting}
          isResetEditor={isResetEditor}
        />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      {error && (
        <p className="text-destructive dark:text-red-500/85 text-sm">
          {isInactiveLangError
            ? inactiveLangErrorMessage
            : error[activeLang].message}
        </p>
      )}
    </FormItem>
  );
}
