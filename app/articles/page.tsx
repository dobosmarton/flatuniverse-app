import { Suspense } from 'react';
import { FallbackLoader } from '@/components/fallback-loader';
import { Articles } from './components/articles';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
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
