import { Suspense } from 'react';
import { Articles } from './articles/components/articles';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function Home({ searchParams }: Readonly<Props>) {
  return (
    <Suspense>
      <Articles searchParams={searchParams} />
    </Suspense>
  );
}

// revalidate every 24 hours
export const revalidate = 3600 * 24;
