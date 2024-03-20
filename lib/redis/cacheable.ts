import { z } from 'zod';
import { client } from './client';
import { SetCommandOptions } from '@upstash/redis';

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
 * @returns {Function} The cacheable function.
 */
export const cacheableFunction = <T, R>(
  keyExtractor: (params: T) => string,
  schema: z.Schema,
  options?: SetCommandOptions
) => {
  return (fn: (props: T) => Promise<R>) => {
    return async (props: T): Promise<R> => {
      const key = keyExtractor(props);

      const cached = await client.get<string>(key);

      if (cached) {
        const parsedValue = isJsonString(cached) ? JSON.parse(cached) : cached;

        const parsed = schema.safeParse(parsedValue);
        if (parsed.success) {
          return parsed.data;
        }
        console.error(parsed.error);
      }

      const result = await fn(props);

      await client.set(key, JSON.stringify(result), options);
      return result;
    };
  };
};
