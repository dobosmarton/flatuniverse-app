import { Toolbar } from './articles/components/toolbar';
import { NewsletterSection } from '@/components/newsletter-section';
import { Suspense } from 'react';
import { ArticleListLoader } from './articles/components/article-list-loader';
import { FallbackLoader } from '@/components/fallback-loader';
import { getCategoryTree } from '@/lib/categories/categories.server';

export default async function Home() {
  const categoryTree = await getCategoryTree([]);
  return (
    <main className="flex flex-col px-4 py-4 sm:py-16 md:px-20 gap-4">
      <Toolbar categoryTree={categoryTree} />

      <NewsletterSection closable />

      <Suspense fallback={<FallbackLoader />}>
        <ArticleListLoader categoryTree={categoryTree} />
      </Suspense>
    </main>
  );
}
