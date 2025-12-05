import { Montserrat } from 'next/font/google';
import '../globals.css';
import SessionProvider from '@/components/session-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  fallback: ['sans-serif'],
});

export const metadata = {
  title: 'Sign In - Prisko Jr Mod',
  robots: {
    index: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} flex flex-col min-h-screen`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            {children}

            <Toaster
              richColors
              expand
              visibleToasts={3}
              position="bottom-center"
              toastOptions={{
                classNames: {
                  toast: 'group-[.toaster]:pointer-events-auto',
                  title: 'text-[15px]',
                  description: 'text-[15px]',
                },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
