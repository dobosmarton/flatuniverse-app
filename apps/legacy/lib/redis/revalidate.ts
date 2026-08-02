import { client } from './client';

export const revalidateKey = async (key: string) => {
  return client.del(key);
};

export const revalidateKeys = async (...keys: string[]) => {
  return client.del(...keys);
};
