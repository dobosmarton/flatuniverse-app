import { getArticleMetadataList } from '@/lib/article-metadata/metadata.server';
import React from 'react';
import { ArticleList } from './article-list';

type Props = {
  categoryTree: {
    [groupName: string]: { key: string; value: string }[];
  };
};

export const ArticleListLoader: React.FC<Props> = async ({ categoryTree }) => {
  const defaultArticleList = await getArticleMetadataList();

  return <ArticleList initialArticles={defaultArticleList} categoryTree={categoryTree} />;
};
