import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';

import './globals.css';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import { CookieBanner } from '@/components/cookie-banner';
import { AnalyticsProvider } from './analytics-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flat universe',
  description:
    'The Earth is not flat, but the universe is still may be. Follow the latest research papers and articles on the flat universe.',
};

const PostHogPageView = dynamic(() => import('./analytics-pageview'), {
  ssr: false,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className="flex gap-4 p-4 border-b border-black border-solid sm:px-8 border-opacity-20">
          <Navbar />
        </header>
        <AnalyticsProvider>
          {children}
          <PostHogPageView />
          <CookieBanner />
        </AnalyticsProvider>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
