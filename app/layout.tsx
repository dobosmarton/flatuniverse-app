import type { Metadata } from 'next';
import { siGithub, siX } from 'simple-icons';
import { Inter } from 'next/font/google';

import './globals.css';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Research App',
  description: 'Research News',
};

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
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
