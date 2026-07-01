import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/id';
import 'dayjs/locale/en';

dayjs.extend(utc);
dayjs.extend(timezone);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

export function getTimezoneOffsetLabel(tz) {
  const offsetMinutes = dayjs.tz(tz).utcOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hour = Math.abs(Math.trunc(offsetMinutes / 60));
  const minute = Math.abs(offsetMinutes % 60);

  return `UTC${sign}${hour.toString().padStart(2, 0)}:${minute.toString().padStart(2, 0)}`;
}

export function formatDateTime(epoch) {
  return dayjs.unix(epoch).tz(process.env.NEXT_PUBLIC_TIMEZONE).format('DD MMM YYYY HH:mm');
}

export function formatDate(epoch) {
  return dayjs.unix(epoch).tz(process.env.NEXT_PUBLIC_TIMEZONE).format('DD MMM YYYY');
}

export function formatMonthYear(epoch, useShortYear = false) {
  let format = 'MMM YYYY';
  if (useShortYear) format = 'MMM YY';

  return dayjs.unix(epoch).tz(process.env.NEXT_PUBLIC_TIMEZONE).format(format);
}

export function formatTime(epoch) {
  return dayjs.unix(epoch).tz(process.env.NEXT_PUBLIC_TIMEZONE).format('HH:mm');
}

export function formatUtcDateTime(epoch) {
  return dayjs.unix(epoch).utc().format('YYYY-MM-DD HH:mm:ss');
}
