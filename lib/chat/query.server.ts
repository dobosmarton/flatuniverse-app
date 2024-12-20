'use server';

import { SimpleChatEngine, OpenAI } from 'llamaindex';
import { z } from 'zod';
import crypto from 'crypto';
import * as redis from '../redis';

export type TemporalQueryAnalysis = redis.TemporalAnalysis;

const temporalAnalysisSchema = z.object({
  isTemporalQuery: z.boolean().nullable(),
  timeFrame: z
    .object({
      start: z.date().or(z.string().transform((s) => new Date(s))),
      end: z.date().or(z.string().transform((s) => new Date(s))),
    })
    .nullable(),
  yearMentioned: z
    .number()
    .or(z.string().transform((s) => parseInt(s)))
    .nullable(),
  temporalWeight: z
    .number()
    .or(z.string().transform((s) => parseFloat(s)))
    .nullable(),
});

/**
 * Analyzes a query string for temporal aspects and returns structured temporal analysis.
 *
 * @param query - The query string to analyze
 * @returns Promise resolving to temporal analysis containing:
 *   - isTemporalQuery: Whether query asks about time-specific info
 *   - timeFrame: Time period mentioned with start/end dates
 *   - temporalWeight: Importance of time to query (0-1)
 */
export const _analyzeTemporalQuery = async (query: string): Promise<TemporalQueryAnalysis> => {
  const temporalAnalysisPrompt = `Analyze the following query for temporal aspects. The current date is ${new Date().toISOString()}.
    Return a JSON object with:
    - isTemporalQuery (boolean): true if the query asks about time-specific information
    - timeFrame (optional): specific time period mentioned, in the format {"start": <date>, "end": <date>}. Be aware that the time period can be a range or a single year and sometimes the time period is not mentioned directly, e.g. "latest".
    - yearMentioned (optional): specific year mentioned, use this if the query is about a single year
    - temporalWeight (number 0-1): how important time is to this query
    
    Query: ${query}
    
    Return only the JSON object, no other text in the following format:
    {
      "isTemporalQuery": <boolean>,
      "timeFrame": { "start": <date>, "end": <date> },
      "yearMentioned": <string>,
      "temporalWeight": <number>
    }`;

  const engine = new SimpleChatEngine({
    llm: new OpenAI({ model: 'gpt-4o-mini' }),
  });

  const analysisStr = await engine.chat({ message: temporalAnalysisPrompt });

  const analysis = JSON.parse(analysisStr.message.content as string);

  const parsedAnalysis = temporalAnalysisSchema.parse(analysis);

  let timeFrame;
  if (parsedAnalysis.yearMentioned) {
    timeFrame = {
      start: new Date(parsedAnalysis.yearMentioned, 0, 1),
      end: new Date(parsedAnalysis.yearMentioned, 11, 31),
    };
  } else if (parsedAnalysis.isTemporalQuery && !parsedAnalysis.timeFrame) {
    // Default to recent documents for queries about "latest" without specific timeframe
    timeFrame = {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      end: new Date(),
    };
  }

  return {
    isTemporalQuery: parsedAnalysis.isTemporalQuery ?? false,
    timeFrame: timeFrame ?? parsedAnalysis.timeFrame,
    temporalWeight: parsedAnalysis.temporalWeight ?? 0,
  };
};

export const analyzeTemporalQuery = redis.cacheableFunction<string, redis.TemporalAnalysis>(
  (query) => redis.keys.analyzeTemporalQuery(crypto.createHash('md5').update(query).digest('hex')),
  redis.temporalAnalysisSchema,
  // 1 hour
  { ex: 60 * 60 }
)(_analyzeTemporalQuery);
