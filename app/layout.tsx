import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { Inter } from 'next/font/google';

import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { AnalyticsProvider } from './analytics-provider';
import { ChatModal } from '@/components/chat-modal';
import { SidebarProvider } from '@/components/ui/sidebar';

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
      <Script
        type="text/javascript"
        src="https://app.termly.io/resource-blocker/614674d1-e55f-498e-9a9f-8f157df2ac96?autoBlock=on"></Script>
      <body>
        <SidebarProvider>
          <main className={`${inter.className} min-h-screen flex flex-col w-full`}>
            <AnalyticsProvider>
              {children}
              <PostHogPageView />
            </AnalyticsProvider>
            <Toaster />
            <ChatModal />
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
