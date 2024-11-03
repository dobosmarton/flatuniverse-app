import { NextRouteFunction } from '@/lib/route-validator.server';
import { getArticleWithPdfLink } from '@/lib/article-metadata/metadata.server';
import * as logger from '@/lib/logger';
import { loadPDF } from '@/lib/file-handlers';
import { addNewEmbeddings } from '@/lib/embeddings/embeddings.server';

type Params = { params: { id: string } };

const generateEmbeddings: NextRouteFunction<Params> = async (_, { params }) => {
  const metadata = await getArticleWithPdfLink(params.id);

  if (!metadata?.pdfLink) {
    return Response.json('Article not found', { status: 404 });
  }

  const pdfNodes = await loadPDF(metadata.pdfLink, {
    metadata_id: params.id,
    published: metadata.published,
  });

  logger.log('PDF file loaded successfully!');

  await addNewEmbeddings(params.id, pdfNodes);

  logger.log('Embeddings added successfully!');

  return Response.json('Embeddings added successfully!', { status: 200 });
};

export const POST = generateEmbeddings;
