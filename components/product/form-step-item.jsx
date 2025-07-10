'use client';

import { Check } from 'lucide-react';

export default function FormStepItem({
  stepNumber,
  label,
  status,
}) {
  return (
    <section className={`flex items-center space-x-2 ${status === 'nonactive' ? 'opacity-50' : ''}`}>
      <div
        className={`rounded-sm size-6 flex-none text-sm flex justify-center items-center ${status === 'complete' ? 'bg-zinc-200/50 dark:bg-zinc-800/80' : status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-zinc-200/60 dark:bg-zinc-700/60'}`}
      >
        {status === 'complete' ? (
          <Check className="size-4" />
        ) : (
          <span>{stepNumber}</span>
        )}
      </div>
      <h3>{label}</h3>
    </section>
  );
}
