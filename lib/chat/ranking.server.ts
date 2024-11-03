'use server';

import { TemporalQueryAnalysis } from './query.server';
import { DocumentSuggestion } from './suggestion.server';

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
    .slice(0, topK);
};
