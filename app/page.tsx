import { Toolbar } from './articles/components/toolbar';
import { NewsletterSection } from '@/components/newsletter-section';
import { Suspense } from 'react';
import { ArticleListLoader } from './articles/components/article-list-loader';
import { FallbackLoader } from '@/components/fallback-loader';
import { getCategoryTree } from '@/lib/categories/categories.server';
import { sarchAuthorsByName } from '@/lib/authors';

export default async function Home() {
  const categoryTree = await getCategoryTree([]);
  const authorList = await sarchAuthorsByName({ pageSize: 100 });
  return (
    <main className="flex flex-col px-4 py-4 sm:py-16 md:px-20 gap-4">
      <Toolbar categoryTree={categoryTree} authors={authorList} />

      <NewsletterSection closable />

      <Suspense fallback={<FallbackLoader />}>
        <ArticleListLoader categoryTree={categoryTree} />
      </Suspense>
    </main>
  );
}

// revalidate every 24 hours
export const revalidate = 3600 * 24;
