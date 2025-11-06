'use client';

import { useSession } from 'next-auth/react';
import { CalendarFold } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import dayjs from 'dayjs';
import { Clock4 } from 'lucide-react';
import 'dayjs/locale/id';
import 'dayjs/locale/en';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

export default function DashHeader() {
  const { data: session } = useSession();

  return (
    <>
      <div className="flex-1">
        <h1 className="text-2xl mb-1 font-bold flex items-center">
          <span className="me-1.5">Hello,</span>
          {session ? 
            <span>{session.user.name}</span>
          :
            <Skeleton className="h-[27px] w-25 inline-block" />
          }
        </h1>
        <h2 className="text-zinc-700 dark:text-zinc-300/80">Here’s what’s going on at your business right now.</h2>
        <div className="text-zinc-700/90 dark:text-zinc-300/80 text-sm flex items-center gap-1 mt-1.5">
          <div className="rounded-md bg-zinc-100/90 dark:bg-zinc-800/70 px-1 py-0.5">
            <Clock4 size={16} className="icon" />
          </div>
          <span>CMS interface: UTC+07:00 • Customer view: local time (unless noted otherwise).</span>
        </div>
      </div>
      <div className="flex max-lg:flex-row-reverse gap-3 max-lg:justify-end items-center text-zinc-700 dark:text-zinc-300/80">
        <time className="font-medium">
          {dayjs().tz(process.env.NEXT_PUBLIC_TIMEZONE).format('DD MMM YYYY')}
        </time>
        <div className="rounded-md bg-zinc-100/90 dark:bg-zinc-800/70 p-2">
          <CalendarFold size={22} />
        </div>
      </div>
    </>
  );
}
