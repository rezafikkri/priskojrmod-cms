'use client';

import { useTheme } from 'next-themes';
import {
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from "@/lib/utils"

export default function ToggleTheme({
  className,
  ...props
}) {
  const { theme, setTheme } = useTheme();

  function handleTheme() {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light')
    }
  }

  return (
    <button
      className={cn([
        className,
        'w-full',
      ])}
      {...props}
      onClick={handleTheme}
    >
      <Sun className="hidden dark:inline-block" />
      <Moon className="inline-block dark:hidden" />
      <span> Toggle theme</span>
    </button>
  );
}
