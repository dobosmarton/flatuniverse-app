'use server';

import { addNewArticleMetadata, getLatestArticleMetadata } from './metadata.server';
import { metadataParser } from './parser';
import { ArticleMetadata, ArticleMetadataEntry } from './schema';
import { xmlParser } from '../xml-parser';

const loadAllArticles = async (): Promise<ArticleMetadataEntry[]> => {
  const lastSavedArticle = await getLatestArticleMetadata();

  let articles: ArticleMetadataEntry[] = [];

  if (!lastSavedArticle) {
    const metadata = await loadArticles();
    return metadata?.entries ?? [];
  }

  let start = 0;
  while (true) {
    console.log('Loading articles from', start);
    const metadata = await loadArticles(start);
    if (!metadata?.entries.length) {
      console.log('No more articles to load');
      break;
    }

    articles.push(...metadata.entries);

    if (metadata.entries.some((article) => article.id === lastSavedArticle.external_id)) {
      console.log('Found last saved article');
      break;
    }

    start += metadata.entries.length ?? 0;
  }

  return articles;
};

const loadArticles = async (start = 0, maxResults = 10): Promise<ArticleMetadata | null> => {
  const search_query = '';
  const sortBy = 'submittedDate';
  const sortOrder = 'descending';

  const result = await fetch(
    `http://export.arxiv.org/api/query?search_query=${search_query}&start=${start}&max_results=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );

  const res = await result.text();

  const parser = xmlParser();

  let jObj = parser.parse(res);

  return metadataParser(jObj.feed);
};

export const articleLoader = async () => {
  const articles = await loadAllArticles();

  if (articles.length) {
    const metadataList = await addNewArticleMetadata(articles);
    return metadataList;
  }

  return null;
};
