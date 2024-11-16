import { Metadata } from 'next';
import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { AskAIButton } from './components/ask-ai-button';
import { PaperCarousel } from './components/paper-carousel';
import { Footer } from '@/components/footer';
import { NewsletterSection } from './components/newsletter-section';

export const metadata: Metadata = {
  title: 'Flatuniverse landing page',
  description: 'Discover and understand research papers with our powerful search engine and AI assistant.',
  keywords: 'research papers, search engine, AI assistant, academic research',
  robots: 'index, follow',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 bg-gray-100">
        <section className="m-4 py-12 md:py-24 lg:py-32 xl:py-48 bg-white drop-shadow-sm rounded">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-3xl tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Discover and Understand Research Papers
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl font-light dark:text-gray-400">
                Search, filter, and chat with AI to gain deeper insights into academic research.
              </p>

              <div className="flex w-full max-w-sm py-4 gap-4 justify-center">
                <AskAIButton />
                <Button variant={'ghost'} asChild size={'lg'} className="rounded-full">
                  <Link href="/articles">Read articles</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="container w-full py-12 lg:py-32 lg:px-32 dark:bg-gray-800">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl">Advanced Search</h2>
              <p className="max-w-[300px] font-light text-gray-500 dark:text-gray-400">
                Find relevant papers quickly with our powerful search engine.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl">Smart Filtering</h2>
              <p className="max-w-[300px] font-light text-gray-500 dark:text-gray-400">
                Filter papers by topic, author, publication date, and more.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl">AI-Powered Chat</h2>
              <p className="max-w-[300px] font-light text-gray-500 dark:text-gray-400">
                Discuss and gain insights from papers with our AI assistant.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container flex flex-col lg:flex-row lg:justify-between items-start lg:items-center lg:px-32">
            <h2 className="text-3xl sm:text-4xl lg:mb-8">Latest Papers</h2>
            <Button
              variant={'link'}
              asChild
              className="flex gap-2 text-lg font-normal lg:items-center px-0"
              size={'lg'}>
              <Link href={`/articles`}>
                {'Read articles'}
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="container px-0 md:pl-32 flex">
            <PaperCarousel />
          </div>
        </section>
        <section className="flex flex-col w-full gap-16 py-12 md:py-24 md:px-32 dark:bg-gray-100 bg-gray-800 text-white dark:text-gray-800">
          <div className="container flex flex-col gap-2 items-start">
            <h2 className="text-3xl font-medium sm:text-4xl md:text-5xl">Get started in a few seconds</h2>
            <span className="font-light">
              Read research papers without any signup, and use our AI assistant to gain deeper insights.
            </span>
            <Button size="lg" variant={'secondary'} className="mt-2 rounded-full" asChild>
              <Link href={`/articles`}>Read articles</Link>
            </Button>
          </div>

          <div className="container flex flex-col lg:flex-row lg:justify-between">
            <div className="flex flex-col gap-2 pl-8 py-2 border-l border-white">
              <span className="text-6xl">150k+</span>
              <span className="font-thin">Research papers</span>
            </div>
            <div className="flex flex-col gap-2 pl-8 py-2 border-l border-white">
              <span className="text-6xl">200k+</span>
              <span className="font-thin">Authors</span>
            </div>
            <div className="flex flex-col gap-2 pl-8 py-2 border-l border-white">
              <span className="text-6xl">8</span>
              <span className="font-thin">Category groups</span>
            </div>
          </div>
        </section>

        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}

// revalidate every 12 hours
export const revalidate = 3600 * 12;
