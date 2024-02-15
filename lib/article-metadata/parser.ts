import { SafeParseReturnType } from 'zod';
import { ArticleMetadata, articleMetadataSchema } from './schema';

export const metadataParser = (articleMetadata: unknown): ArticleMetadata | null => {
  const parsedMetadataResult = articleMetadataSchema.safeParse(articleMetadata);

  if (!parsedMetadataResult.success) {
    // handle error then return

    console.log('articleMetadata', articleMetadata);
    console.error(
      'Error parsing metadata',
      parsedMetadataResult.error.errors.map((err) => JSON.stringify(err))
    );
    return null;
  } else {
    // do something
    return parsedMetadataResult.data;
  }
};
