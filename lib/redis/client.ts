import { Redis } from '@upstash/redis';

export const client = new Redis({
  url: process.env.REDIS_REST_URL ?? '',
  token: process.env.REDUS_REST_TOKEN ?? '',
});
