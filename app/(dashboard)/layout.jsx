import { Montserrat } from 'next/font/google';
import '../globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import ReactQueryProvider from '@/components/react-query-provider';
import { Toaster } from '@/components/ui/sonner';
import SessionProviderWrapper from '@/components/session-provider';
import NextTopLoader from 'nextjs-toploader';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  fallback: ['sans-serif'],
});

export const metadata = {
  title: {
    template: '%s - Prisko Jr Mod',
    default: 'Dashboard - Prisko Jr Mod',
  },
  robots: {
    index: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable}`}
      >
        <NextTopLoader
          color="#1CB454"
          showSpinner={false}
        />
        <SessionProviderWrapper>
          <SidebarProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            >
              <AppSidebar />
              <SidebarInset className="min-h-[96vh] overflow-x-hidden">
                <Header />
                <div className="flex-1 p-4 mb-25">
                  <ReactQueryProvider>
                    {children}
                  </ReactQueryProvider>
                </div>
                <Footer />
              </SidebarInset>
              <Toaster
                richColors
                expand
                visibleToasts={3}
                position="bottom-right"
                toastOptions={{
                  style: { minWidth: '400px' },
                  classNames: {
                    toast: 'group-[.toaster]:pointer-events-auto',
                    title: 'text-[15px]',
                    description: 'text-[15px]',
                  },
                }}
              />
            </ThemeProvider>
          </SidebarProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
