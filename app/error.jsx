'use client' // Error boundaries must be Client Components

import { Montserrat } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  fallback: ['sans-serif'],
});

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className={`${montserrat.variable} w-full h-screen flex flex-col justify-center items-center`}>
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
  )
}
