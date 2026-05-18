'use client'; // Error boundaries must be Client Components

import { Button } from '@/components/ui/button';

export default function Error({ reset }) {
  return (
    <div className={`w-full h-full flex flex-col justify-center items-center`}>
      <h2 className="text-xl font-medium mb-7">Something went wrong. Please try again.</h2>
      <Button
        className="h-auto inline-block text-base px-3 py-1.5"
        variant="secondary"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
    </div>
  );
}
