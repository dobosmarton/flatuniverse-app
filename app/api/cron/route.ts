import { NextRouteFunction } from '@/lib/route-validator.server';
import * as articleLoaderService from '@/lib/article-metadata/loader.server';
import type { GetCategoryGroups } from '@/lib/categories/categories.server';
import { getMetadata } from '@/lib/oai-pmh';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { ArticleMetadataEntry } from '@/lib/article-metadata/schema';

const batchSize = 100;

const syncArticles: NextRouteFunction<{}, GetCategoryGroups> = async () => {
  // await articleLoaderService.articleLoader();
  const startDate = '2024-02-29';
  const minimumDate = '2024-01-01';

  const iterator = getMetadata(startDate);

  const startDateObj = new Date(minimumDate).getTime();

  let batchItems: ArticleMetadataEntry[] = [];
  let batchIndex = 0;

  for await (const item of iterator) {
    // console.log('item', item.metadata.id, item.metadata.created, item.metadata.updated);
    console.log('Metadata fetch started, batch index: ', batchIndex, 'batch length: ', batchItems.length);

    const created = item.metadata.published.getTime();
    const updated = item.metadata.updated ? item.metadata.updated.getTime() : null;

    console.log('created: ', item.metadata.published, 'updated: ', item.metadata.updated);

    if (created >= startDateObj || (updated && updated >= startDateObj)) {
      batchItems.push(item.metadata);
    }

    if (batchItems.length >= batchSize) {
      await articleMetadataService.addNewArticleMetadata(batchItems);
      batchItems = [];
      batchIndex++;
      console.log('Batch inserted: ', batchIndex);
    }
  }

  return Response.json({ status: 200 });
};

export const POST = syncArticles;
