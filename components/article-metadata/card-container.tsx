'use client';

import React from 'react';
import { ArticleMetadataCard } from './card';
import { article_metadata } from '@prisma/client';
import useSWR from 'swr';
import { fetcher, FetchError, RetriableFetchError } from '@/lib/api-client/fetch';
import { SimilarArticleMetadataList } from '@/lib/article-metadata/similarity.server';
import { SimilarArticleCard } from './similar-article-card';
import { cn } from '@/lib/utils';
import { CardSkeleton } from './card-skeleton';

type Props = {
  article: Omit<article_metadata, 'published'> & {
    published: string | Date;
    authors: { author: { name: string } }[];
    categories: { category: { short_name: string; full_name: string; group_name: string } }[];
    links: { link: { title: string | null; href: string; type: string | null } }[];
  };
};

const isRetriableFetchError = (error: unknown): error is RetriableFetchError => error instanceof RetriableFetchError;

export const ArticleMetadataCardContainer: React.FC<Props> = ({ article }) => {
  const [showSimilarArticles, setShowSimilarArticles] = React.useState(false);
  const [selectedSimilarItem, setSelectedSimilarItem] = React.useState<string | null>(null);

  const { data, isLoading, error } = useSWR<SimilarArticleMetadataList | null, FetchError>(
    showSimilarArticles ? `/api/articles/${article.id}/similars` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, _, __, revalidate, { retryCount }) => {
        if (isRetriableFetchError(error)) {
          setTimeout(() => revalidate({ retryCount }), error.retryAfter);
        }
      },
    }
  );

  const toggleSimilarArticles = () => setShowSimilarArticles((state) => !state);

  const similarItemList = selectedSimilarItem ? data?.filter((metadata) => metadata.id === selectedSimilarItem) : data;

  const loading = isLoading || isRetriableFetchError(error);

  return (
    <div className="flex flex-col gap-4 w-full md:flex-row md:justify-between">
      <div
        className={cn('flex ', {
          'md:w-6/12': showSimilarArticles && !!selectedSimilarItem,
          'md:w-8/12': showSimilarArticles && !selectedSimilarItem,
          'w-full': !showSimilarArticles,
        })}>
        <ArticleMetadataCard
          key={article.id}
          id={article.id}
          title={article.title}
          slug={article.slug}
          published={new Date(article.published).toDateString()}
          abstract={article.abstract}
          authors={article.authors.map((connection) => connection.author.name)}
          categories={article.categories.map((connection) => connection.category)}
          links={article.links.map((connection) => connection.link)}
          toggleSimilarArticles={toggleSimilarArticles}
        />
      </div>

      {showSimilarArticles ? (
        <div
          className={cn('flex flex-col gap-2 w-full', {
            'md:w-6/12': !!selectedSimilarItem,
            'md:w-4/12': !selectedSimilarItem,
          })}>
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : null}
          {!loading && similarItemList
            ? similarItemList.map((metadata) => (
                <SimilarArticleCard
                  key={metadata.id}
                  similarToTitle={article.title}
                  slug={metadata.slug}
                  id={metadata.id}
                  title={metadata.title}
                  published={metadata.published}
                  abstract={metadata.abstract}
                  authors={metadata.authors.map((connection) => connection.author.name)}
                  categories={metadata.categories.map((connection) => connection.category)}
                  links={metadata.links.map((connection) => connection.link)}
                  setSelectedSimilarItem={setSelectedSimilarItem}
                />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};
