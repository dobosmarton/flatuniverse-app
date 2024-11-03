'use server';

import { Metadata } from 'llamaindex';
import { TemporalQueryAnalysis } from './query.server';
import { DocumentSuggestion } from './suggestion.server';

const getMetadataId = (metadata: Metadata) => metadata.metadataId || metadata.metadata_id;

/**
 * Ranks documents based on temporal relevance and similarity scores.
 *
 * @param documents - Array of document suggestions with similarity scores
 * @param temporalAnalysis - Analysis of temporal aspects of the query
 * @param topK - Maximum number of documents to return
 * @returns Ranked and filtered array of documents
 */
export const rankTemporalDocuments = async (
  documents: DocumentSuggestion[],
  temporalAnalysis: TemporalQueryAnalysis,
  topK: number
) => {
  if (!temporalAnalysis.isTemporalQuery) return documents;

  return documents
    .map((document) => {
      const docDate = new Date(document.metadata.timestamp);
      const now = new Date();
      const ageInDays = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);

      // Exponential decay for time relevance
      const timeScore = Math.exp(-ageInDays / 365);

      // Combine scores
      const finalScore =
        (1 - temporalAnalysis.temporalWeight) * document.score + temporalAnalysis.temporalWeight * timeScore;

      return { ...document, score: finalScore };
    })
    .sort((a, b) => b.score - a.score)
    .reduce<DocumentSuggestion[]>((prev, acc) => {
      if (prev.length < topK && !prev.some((doc) => getMetadataId(doc.metadata) === getMetadataId(acc.metadata))) {
        return [...prev, acc];
      }

      return prev;
    }, []);
};
