import { NextRouteFunction } from '@/lib/route-validator.server';
import { getArticlePdfLink } from '@/lib/article-metadata/metadata.server';
import { addNewEmbeddings } from '@/lib/langchain/embeddings.server';
import { loadPDF } from '@/lib/langchain/file-reader.server';
import * as logger from '@/lib/logger';

type Params = { params: { id: string } };

const generateEmbeddings: NextRouteFunction<Params> = async (_, { params }) => {
  const pdfLink = await getArticlePdfLink(params.id);

  if (!pdfLink) {
    return Response.json('Article not found', { status: 404 });
  }

  const pdfDocs = await loadPDF(pdfLink, { metadata_id: params.id });

  logger.log('PDF file loaded successfully!');

  await addNewEmbeddings(params.id, pdfDocs);

  logger.log('Embeddings added successfully!');

  return Response.json('Embeddings added successfully!', { status: 200 });
};

export const POST = generateEmbeddings;
