import React, { Suspense } from 'react';
import { articleMetadataSearchSchema } from '@/lib/article-metadata/schema';
import { sarchAuthorsByName } from '@/lib/authors';
import { getCategoryTree } from '@/lib/categories/categories.server';
import { NewsletterSection } from '@/components/newsletter-section';
import { FallbackLoader } from '@/components/fallback-loader';
import { ArticleList } from './article-list';
import { Toolbar } from './toolbar';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export const Articles: React.FC<Props> = async ({ searchParams }) => {
  const categoryTree = await getCategoryTree([]);
  const authorList = await sarchAuthorsByName({ pageSize: 100 });
  const parsedSearchParams = articleMetadataSearchSchema.parse(searchParams);

  return (
    <div className="flex flex-col w-full">
      <Toolbar categoryTree={categoryTree} authors={authorList} searchParams={parsedSearchParams} />
      <div className="flex flex-col px-2 md:px-8 py-2 md:py-8 gap-4">
        <NewsletterSection closable />

        <Suspense fallback={<FallbackLoader />}>
          <ArticleList searchParams={parsedSearchParams} />
        </Suspense>
      </div>
    </div>
  );
};
