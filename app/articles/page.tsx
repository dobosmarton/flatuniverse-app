import { Suspense } from 'react';
import { ArticleListLoader } from './components/article-list-loader';
import { FallbackLoader } from '@/components/fallback-loader';
import { getCategoryTree } from '@/lib/categories/categories.server';
import { Toolbar } from './components/toolbar';
import { NewsletterSection } from '@/components/newsletter-section';

export default async function Dashboard() {
  const categoryTree = await getCategoryTree([]);

  return (
    <div className="flex flex-col px-8 py-12 sm:py-16 gap-4">
      <Toolbar categoryTree={categoryTree} />

      <NewsletterSection closable />

      <Suspense fallback={<FallbackLoader />}>
        <ArticleListLoader categoryTree={categoryTree} />
      </Suspense>
    </div>
  );
}
