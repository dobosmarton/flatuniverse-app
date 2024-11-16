import { Suspense } from 'react';
import { FallbackLoader } from '@/components/fallback-loader';
import { Articles } from './components/articles';
import { Metadata } from 'next';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export const metadata: Metadata = {
  title: 'Research articles',
  description: 'Read and chat with the latest research articles on the flatuniverse app.',
  keywords: 'flat universe, articles, research papers, academic research',
  robots: 'index, follow',
};

export default function ArticlesPage({ searchParams }: Readonly<Props>) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen w-full">
          <FallbackLoader />
        </div>
      }>
      <Articles searchParams={searchParams} />
    </Suspense>
  );
}

// revalidate every 24 hours
export const revalidate = 3600 * 24;
