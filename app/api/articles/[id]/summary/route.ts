import { NextRouteFunction } from '@/lib/route-validator.server';
import { loadPDF } from '@/lib/file-handlers';
import { getSummaryByDocuments } from '@/lib/embeddings/summarization.server';
import * as articleService from '@/lib/article-metadata/metadata.server';
import * as logger from '@/lib/logger';

type Params = { params: { id: string } };

const getSummary: NextRouteFunction<Params> = async (_, { params }) => {
  const summary = await articleService.getGeneratedSummary(params.id);

  if (summary?.generated_summary) {
    return Response.json({ data: summary.generated_summary }, { status: 200 });
  }

  const pdfLink = await articleService.getArticlePdfLink(params.id);

  if (!pdfLink) {
    return Response.json('Article not found', { status: 404 });
  }

  const pdfNodes = await loadPDF(pdfLink, { metadata_id: params.id });

  logger.log('PDF file loaded successfully!');

  const generatedSummary = await getSummaryByDocuments(pdfNodes);

  logger.log('Summary generated successfully!', generatedSummary);

  if (!generatedSummary) {
    return Response.json('Summary not generated', { status: 404 });
  }

  await articleService.addGeneratedSummary(params.id, generatedSummary);

  logger.log('Summary added to metadata successfully!');

  return Response.json({ data: generatedSummary }, { status: 200 });
};

export const GET = getSummary;
