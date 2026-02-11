import { Montserrat } from 'next/font/google';
import './globals.css';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  fallback: ['sans-serif'],
});

export default function NotFound() {
  return (
    <div className={`${montserrat.variable} w-full h-screen flex flex-col justify-center items-center`}>
      <h2 className="text-xl font-medium mb-7">Page Not Found</h2>
      <Button
        className="h-auto inline-block text-base px-3 py-1.5"
        variant="secondary"
        asChild
      >
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}
