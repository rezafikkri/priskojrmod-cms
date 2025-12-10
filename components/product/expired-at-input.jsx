'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Button } from '../ui/button';
import { formatDate } from '@/lib/format-date';
import { useState } from 'react';

export default function ExpiredAtInput({
  field,
  description,
  disabled = false,
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function handleDateChange(date, fieldValue) {
    if (date) {
      let newDate = new Date(date);
      let oldDate;
      if (!(fieldValue instanceof Date)) {
        oldDate = new Date(parseInt(fieldValue) * 1000);
      } else {
        oldDate = new Date(fieldValue);
      }

      if (!isNaN(oldDate)) {
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
      } else {
        newDate.setHours(23, 59);
      }
      field.onChange(newDate);
    } else {
      field.onChange('');
    }
    setIsCalendarOpen(false);
  }

  function handleHourChange(hour, fieldValue) {
    const newDate = new Date(fieldValue);
    if (!isNaN(newDate.getTime())) {
      newDate.setHours(hour);
      field.onChange(newDate);
    }
  }

  function handleMinuteChange(minute, fieldValue) {
    const newDate = new Date(fieldValue);
    if (!isNaN(newDate.getTime())) {
      newDate.setMinutes(minute);
      field.onChange(newDate);
    }
  }

  // This function is for get Date object from epoch time
  function getDate(fieldValue) {
    if (fieldValue && !(fieldValue instanceof Date)) {
      return new Date(parseInt(fieldValue) * 1000);
    }
    return fieldValue;
  }

  function getHours(fieldValue) {
    if (fieldValue) {
      if (fieldValue instanceof Date) return fieldValue.getHours();
      return new Date(parseInt(fieldValue) * 1000).getHours();
    }
    return fieldValue;
  }

  function getMinutes(fieldValue) {
    if (fieldValue) {
      if (fieldValue instanceof Date) return fieldValue.getMinutes();
      return new Date(parseInt(fieldValue) * 1000).getMinutes();
    }
    return fieldValue;
  }

  return (
    <FormItem className="flex-1">
      <FormLabel className="text-base">Expired At</FormLabel>
      <div className="flex items-center">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild className="shadow-none text-base h-auto! px-3 py-1.5 flex-1">
            <FormControl>
              <Button
                disabled={disabled}
                variant="outline"
                className={cn(
                  "pl-3 text-left font-normal w-full text-base",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  formatDate(
                    (field.value instanceof Date)
                      ? Math.floor(field.value.getTime() / 1000)
                      : field.value,
                  )
                ) : (
                    <span>Pick a date</span>
                  )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={getDate(field.value)}
              onSelect={(date) => handleDateChange(date, field.value)}
              disabled={{ before: new Date() }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>

        <Select
          onValueChange={(hour) => handleHourChange(hour, field.value)}
          value={getHours(field.value)}
          disabled={!field.value || disabled}
        >
          <SelectTrigger className="shadow-none text-base min-h-9.5 h-auto! px-3 py-1.5 ms-3">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[15px]">Hour</SelectLabel>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} className="text-base" value={i}>{i.toString().padStart(2, 0)}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="mx-1.5">:</span>
        <Select
          onValueChange={(minute) => handleMinuteChange(minute, field.value)}
          value={getMinutes(field.value)}
          disabled={!field.value || disabled}
        >
          <SelectTrigger className="shadow-none text-base min-h-9.5 h-auto! px-3 py-1.5">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[15px]">Minute</SelectLabel>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].map(m => (
                <SelectItem key={m} className="text-base" value={m}>{m.toString().padStart(2, 0)}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="ms-2">WIB</span>
      </div>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}
