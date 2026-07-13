import { Language } from '@/constants/enums';
import { Button } from './button';
import { Alert, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

/*
 * This is for check in other section has error or not
 */
function hasOtherSectionError({
  errors,
  activeLang,
  fieldNames = ['title', 'content'],
}) {
  let isCurrentSectionError = false;
  let isOtherSectionError = false;
  for (const fn of fieldNames) {
    if (errors[fn] && errors[fn][activeLang]) {
      isCurrentSectionError = true;
    } else if (errors[fn]) {
      isOtherSectionError = true;
    }
  }

  // if current section exist error, then return false
  if (isCurrentSectionError) return false;
  // for now, current section is no error. If other section exist error
  if (isOtherSectionError) return true;
}

export default function FormLanguageToggle({
  activeLang,
  onToggle,
  errors,
  fieldNames,
}) {
  return (
    <div className="mb-6">
      <div className="flex space-x-2 mb-2">
        <Button
          variant="ghost"
          className={activeLang === Language.ID ? 'bg-accent' : ''}
          onClick={() => onToggle(Language.ID)}
        >
          Indonesia
        </Button>
        <Button
          variant="ghost"
          className={activeLang === Language.EN ? 'bg-accent' : ''}
          onClick={() => onToggle(Language.EN)}
        >
          English
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Select a language to enter content</p>
      {hasOtherSectionError({ errors, activeLang, fieldNames }) && (
        <Alert
          variant="destructive"
          className="border-destructive/50 text-base items-baseline mt-2.5"
        >
          <AlertCircle />
          <AlertTitle className="line-clamp-0">
            There are errors in the {activeLang === Language.ID ? 'English' : 'Indonesian'} section
          </AlertTitle>
        </Alert>
      )}
    </div>
  );
}
