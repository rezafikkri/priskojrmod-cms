import { Language } from '@/constants/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const languages = {
  [Language.ID]: 'Indonesian',
  [Language.EN]: 'English',
};

export default function FormLanguageSelect({
  activeLang,
  onSelect,
  isOtherSectionError,
}) {
  return (
    <>
      <Select
        onValueChange={(value) => onSelect(value)}
        value={activeLang}
      >
        <SelectTrigger
          className={`shadow-none text-base h-auto! px-2 py-1 border-transparent hover:bg-accent font-normal text-sm text-foreground ${isOtherSectionError ? 'text-destructive dark:text-red-500/85 [&_svg:not([class*=\'text-\'])]:text-destructive' : ''}`}
        >
          <SelectValue placeholder="Select a product" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([ key, value ]) => (
            <SelectItem
              key={key}
              value={key}
              className="text-base"
            >
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
