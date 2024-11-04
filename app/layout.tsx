import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';

import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import { CookieBanner } from '@/components/cookie-banner';
import { AnalyticsProvider } from './analytics-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar';
import { ChatModal } from '@/components/chat-modal';

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
      <body>
        <SidebarProvider>
          <AppSidebar />
          <main className={`${inter.className} min-h-screen flex flex-col w-full`}>
            {/* <header className="flex gap-4 p-4 border-b border-black border-solid sm:px-8 border-opacity-20">
              <Navbar />
            </header> */}
            <AnalyticsProvider>
              {children}
              <PostHogPageView />
              <CookieBanner />
            </AnalyticsProvider>
            <Footer />
            <Toaster />
            <ChatModal />
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
