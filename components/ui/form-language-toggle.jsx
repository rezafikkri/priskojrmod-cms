import { Language } from '@/constants/enums';
import { Button } from './button';

/*
 * This is for check in other section has error or not
 */
function hasOtherSectionError(
  errors,
  activeLang,
  fieldNames = ['title', 'content'],
) {
  let isCurrentSectionError = false;
  let isOtherSectionError = false;
  for (const fn of fieldNames) {
    if (errors[fn] && errors[fn][activeLang]) {
      isCurrentSectionError = true;
    }
    if (errors[fn]) {
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
    <div className="space-y-2 mb-6">
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
      <p className="text-sm text-muted-foreground">Select a language to enter content.</p>
      {hasOtherSectionError(errors, activeLang, fieldNames) && (
        <p className="text-destructive text-sm">
          There are errors in the {activeLang === Language.ID ? 'English' : 'Indonesian'} section.
        </p>
      )}
    </div>
  );
}
