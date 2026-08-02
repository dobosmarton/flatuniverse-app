import { SetCommandOptions } from '@upstash/redis';
import { client } from './client';

export const getCache = async (key: string) => {
  return client.get(key);
};

export const setCache = async (key: string, value: string, options?: SetCommandOptions) => {
  return client.set(key, value, options);
};
