import { Suspense } from 'react';
import { ArticleListLoader } from './components/article-list-loader';
import { FallbackLoader } from '@/components/fallback-loader';
import { getCategoryTree } from '@/lib/categories/categories.server';
import { Toolbar } from './components/toolbar';
import { NewsletterSection } from '@/components/newsletter-section';
import { sarchAuthorsByName } from '@/lib/authors';
import { articleMetadataSearchSchema } from '@/lib/article-metadata/schema';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Articles({ searchParams }: Props) {
  const categoryTree = await getCategoryTree([]);
  const authorList = await sarchAuthorsByName({ pageSize: 100 });
  const parsedSearchParams = articleMetadataSearchSchema.parse(searchParams);

  return (
    <div className="flex flex-col px-8 py-12 sm:py-16 gap-4">
      <Suspense>
        <Toolbar categoryTree={categoryTree} authors={authorList} searchParams={parsedSearchParams} />
      </Suspense>

      <NewsletterSection closable />

      <Suspense fallback={<FallbackLoader />}>
        <ArticleListLoader searchParams={parsedSearchParams} />
      </Suspense>
    </div>
  );
}
