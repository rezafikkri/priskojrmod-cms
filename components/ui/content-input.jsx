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
import { FormErrorMessage } from './form-error-message';

export default function ContentInput({
  field,
  activeLang,
  onActiveLangChange,
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
          onSelect={onActiveLangChange}
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
        <FormErrorMessage>
          {isInactiveLangError
            ? inactiveLangErrorMessage
            : error[activeLang].message}
        </FormErrorMessage>
      )}
    </FormItem>
  );
}
