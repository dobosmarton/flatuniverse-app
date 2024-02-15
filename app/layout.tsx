import type { Metadata } from 'next';
import { siGithub, siX } from 'simple-icons';
import { Inter } from 'next/font/google';

import './globals.css';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';

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
        <footer className="flex items-center h-20 gap-1 px-8 font-medium border-t md:px-20">
          Research News
          <span className="text-sm">© 2024</span>
          <nav className="flex justify-end grow sm:gap-2">
            <a
              className="flex gap-2 px-3 py-2 text-sm font-semibold text-gray-600 transition duration-100 rounded-md hover:text-gray-800"
              href="https://github.com/devagrawal09/clerk-nextjs-template">
              <div className="m-auto">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d={siGithub.path}></path>
                </svg>
              </div>
              <span className="hidden sm:inline"> View on Github</span>
            </a>
            <a className="flex flex-col justify-center p-2 hover:underline" href="https://twitter.com/ClerkDev">
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path d={siX.path}></path>
              </svg>
            </a>
          </nav>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
