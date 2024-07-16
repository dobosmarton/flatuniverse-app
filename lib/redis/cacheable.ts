import { z } from 'zod';
import { SetCommandOptions } from '@upstash/redis';
import * as logger from '@/lib/logger';
import { client } from './client';

const cacheMaxBytes = 3000000;

const byteSize = (str: string) => new Blob([str]).size;

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * Creates a cacheable function that caches the result of the provided function based on the given key.
 *
 * @template T The type of the input parameters for the function.
 * @template R The type of the return value of the function.
 * @param {Function} keyExtractor A function that extracts the cache key from the input parameters.
 * @param {z.Schema} schema The schema to validate the cached data against.
 * @param {SetCommandOptions} [options] Optional options for the Redis SET command.
 * @param {Function} [skipCache] Optional function that determines whether to skip caching the result.
 * @returns {Function} The cacheable function.
 */
export const cacheableFunction = <T, R>(
  keyExtractor: (params: T) => string | Promise<string>,
  schema: z.Schema,
  options?: SetCommandOptions,
  skipCache?: (result: R, props: T) => boolean | Promise<boolean>
): ((fn: (props: T) => Promise<R>) => (props: T) => Promise<R>) => {
  return (fn: (props: T) => Promise<R>) => {
    return async (props: T): Promise<R> => {
      const key = await keyExtractor(props);

      const cached = await client.get<string>(key);

      if (cached !== null) {
        const parsedValue = isJsonString(cached) ? JSON.parse(cached) : cached;

        const parsed = schema.safeParse(parsedValue);
        if (parsed.success) {
          logger.log(`Cache hit key: ${key}`);
          return parsed.data;
        }
        logger.error(parsed.error);
      }

      const result = await fn(props);

      if (skipCache) {
        const shouldSkip = await skipCache(result, props);
        if (shouldSkip) {
          return result;
        }
      }

      const bytes = byteSize(JSON.stringify(result));
      if (bytes > cacheMaxBytes) {
        logger.log(`Result too large to cache key: ${key}, size: ${bytes / 1024 ** 2} bytes`);
        return result;
      }

      await client.set(key, JSON.stringify(result), options);
      return result;
    };
  };
};
